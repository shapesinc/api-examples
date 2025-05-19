"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Award, BarChart } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import ThemeToggle from "@/components/theme-toggle"
import UnoCard from "@/components/uno-card"
import PlayerHand from "@/components/player-hand"
import WinnerModal from "@/components/winner-modal"
import AchievementsPanel from "@/components/achievements-panel"
import StatsPanel from "@/components/stats-panel"
import { getAIMove } from "@/lib/shapes-ai"
import {
  createDeck,
  shuffleDeck,
  dealCards,
  isValidMove,
  getNextPlayer,
  type UnoCard as UnoCardType,
  type GameState,
} from "@/lib/game-logic"
import { loadAchievements, unlockAchievement, type Achievement } from "@/lib/achievements"
import { loadStats, updateStats, type GameStats } from "@/lib/stats"

export default function UnoGame() {
  const { toast } = useToast()
  const [gameState, setGameState] = useState<GameState>({
    players: [
      { id: 0, name: "You", isHuman: true, hand: [] },
      { id: 1, name: "AI 1", isHuman: false, hand: [] },
      { id: 2, name: "AI 2", isHuman: false, hand: [] },
      { id: 3, name: "AI 3", isHuman: false, hand: [] },
    ],
    deck: [],
    discardPile: [],
    currentPlayer: 0,
    direction: 1, // 1 for clockwise, -1 for counter-clockwise
    gameStarted: false,
    winner: null,
    currentColor: null, // Used when a wild card is played
    drawCount: 0, // For +2 and +4 cards
    skipNextPlayer: false,
  })
  const [aiThinking, setAiThinking] = useState(false)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [gameLog, setGameLog] = useState<string[]>([])
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<GameStats | null>(null)
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [cardsPlayedCount, setCardsPlayedCount] = useState(0)
  const [cardsDrawnCount, setCardsDrawnCount] = useState(0)
  const [specialCardsPlayedCount, setSpecialCardsPlayedCount] = useState(0)
  const [wildCardsPlayedCount, setWildCardsPlayedCount] = useState(0)
  const [maxCardCount, setMaxCardCount] = useState(0)

  // Track if UNO was called
  const [unoCalled, setUnoCalled] = useState(false)

  // Load achievements and stats on mount
  useEffect(() => {
    setAchievements(loadAchievements())
    setStats(loadStats())
  }, [])

  // Initialize the game
  useEffect(() => {
    startNewGame()
  }, [])

  // Effect to handle AI turns automatically
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner !== null) return

    const currentPlayer = gameState.players[gameState.currentPlayer]

    // If it's AI's turn and not thinking
    if (!currentPlayer.isHuman && !aiThinking) {
      // Add a small delay before AI plays
      const timeoutId = setTimeout(() => {
        handleAITurn()
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [gameState.currentPlayer, gameState.gameStarted, aiThinking, gameState.winner])

  // Effect to handle winner display
  useEffect(() => {
    if (gameState.winner !== null) {
      const winnerName = gameState.players[gameState.winner].name

      // Show winner modal
      setShowWinnerModal(true)

      // Update stats
      if (stats && gameStartTime) {
        const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000)
        const playerWon = gameState.winner === 0

        const updatedStats = updateStats(
          stats,
          playerWon,
          cardsPlayedCount,
          cardsDrawnCount,
          specialCardsPlayedCount,
          wildCardsPlayedCount,
          gameDuration,
          maxCardCount,
        )

        setStats(updatedStats)

        // Check for achievements
        if (playerWon) {
          // First win achievement
          if (!achievements.find((a) => a.id === "first_win")?.unlocked) {
            const updatedAchievements = unlockAchievement("first_win", achievements)
            setAchievements(updatedAchievements)
            setNewAchievement(updatedAchievements.find((a) => a.id === "first_win") || null)

            // Show achievement notification
            toast({
              title: "Achievement Unlocked!",
              description: "First Victory: Win your first game of UNO",
            })
          }

          // Win streak achievement
          if (updatedStats.currentWinStreak >= 3 && !achievements.find((a) => a.id === "win_streak_3")?.unlocked) {
            const updatedAchievements = unlockAchievement("win_streak_3", achievements)
            setAchievements(updatedAchievements)
            setNewAchievement(updatedAchievements.find((a) => a.id === "win_streak_3") || null)

            // Show achievement notification
            toast({
              title: "Achievement Unlocked!",
              description: "Hat Trick: Win 3 games in a row",
            })
          }

          // Quick win achievement
          if (gameDuration < 120 && !achievements.find((a) => a.id === "quick_win")?.unlocked) {
            const updatedAchievements = unlockAchievement("quick_win", achievements)
            setAchievements(updatedAchievements)
            setNewAchievement(updatedAchievements.find((a) => a.id === "quick_win") || null)

            // Show achievement notification
            toast({
              title: "Achievement Unlocked!",
              description: "Speed Demon: Win a game in under 2 minutes",
            })
          }

          // Comeback kid achievement
          if (maxCardCount >= 10 && !achievements.find((a) => a.id === "comeback_kid")?.unlocked) {
            const updatedAchievements = unlockAchievement("comeback_kid", achievements)
            setAchievements(updatedAchievements)
            setNewAchievement(updatedAchievements.find((a) => a.id === "comeback_kid") || null)

            // Show achievement notification
            toast({
              title: "Achievement Unlocked!",
              description: "Comeback Kid: Win a game after having 10+ cards in your hand",
            })
          }
        }

        // Card collector achievement
        if (cardsDrawnCount >= 15 && !achievements.find((a) => a.id === "card_collector")?.unlocked) {
          const updatedAchievements = unlockAchievement("card_collector", achievements)
          setAchievements(updatedAchievements)
          setNewAchievement(updatedAchievements.find((a) => a.id === "card_collector") || null)

          // Show achievement notification
          toast({
            title: "Achievement Unlocked!",
            description: "Card Collector: Draw 15 cards in a single game",
          })
        }

        // Wild thing achievement
        if (wildCardsPlayedCount >= 5 && !achievements.find((a) => a.id === "play_wild")?.unlocked) {
          const updatedAchievements = unlockAchievement("play_wild", achievements)
          setAchievements(updatedAchievements)
          setNewAchievement(updatedAchievements.find((a) => a.id === "play_wild") || null)

          // Show achievement notification
          toast({
            title: "Achievement Unlocked!",
            description: "Wild Thing: Play 5 wild cards in a single game",
          })
        }

        // Night owl achievement
        const currentHour = new Date().getHours()
        if (currentHour >= 0 && currentHour < 5 && !achievements.find((a) => a.id === "night_owl")?.unlocked) {
          const updatedAchievements = unlockAchievement("night_owl", achievements)
          setAchievements(updatedAchievements)
          setNewAchievement(updatedAchievements.find((a) => a.id === "night_owl") || null)

          // Show achievement notification
          toast({
            title: "Achievement Unlocked!",
            description: "Night Owl: Play a game between midnight and 5 AM",
          })
        }
      }
    }
  }, [gameState.winner])

  // Start a new game
  const startNewGame = () => {
    // Create and shuffle the deck
    let deck = createDeck()
    deck = shuffleDeck(deck)

    // Deal cards to players
    const { players, remainingDeck } = dealCards(gameState.players, deck, 7)

    // Set up the discard pile with the top card
    const discardPile = [remainingDeck.pop()!]

    // Make sure the first card is not a wild card
    while (discardPile[0].type === "wild" || discardPile[0].type === "wild-draw-four") {
      remainingDeck.push(discardPile[0])
      discardPile[0] = remainingDeck.pop()!
    }

    // Set the initial game state
    setGameState({
      players,
      deck: remainingDeck,
      discardPile,
      currentPlayer: 0,
      direction: 1,
      gameStarted: true,
      winner: null,
      currentColor: discardPile[0].color,
      drawCount: 0,
      skipNextPlayer: false,
    })

    // Reset game stats
    setGameStartTime(Date.now())
    setCardsPlayedCount(0)
    setCardsDrawnCount(0)
    setSpecialCardsPlayedCount(0)
    setWildCardsPlayedCount(0)
    setMaxCardCount(7) // Start with 7 cards
    setUnoCalled(false)

    setGameLog([`Game started. Top card is ${discardPile[0].color} ${discardPile[0].value || discardPile[0].type}.`])

    // Close winner modal if open
    setShowWinnerModal(false)
  }

  // Handle AI player's turn
  const handleAITurn = async () => {
    setAiThinking(true)

    try {
      const currentPlayer = gameState.players[gameState.currentPlayer]
      const topCard = gameState.discardPile[gameState.discardPile.length - 1]
      const currentColor = gameState.currentColor || topCard.color

      // Create a description of the game state for the AI
      const gameDescription = `
        Current card: ${topCard.color || ""} ${topCard.value || topCard.type}
        Current color: ${currentColor}
        Your hand: ${currentPlayer.hand.map((card) => `${card.color || ""} ${card.value || card.type}`).join(", ")}
        Other players cards left: ${gameState.players
          .map((p, i) => (i !== gameState.currentPlayer ? `${p.name}: ${p.hand.length}` : ""))
          .filter(Boolean)
          .join(", ")}
        Direction: ${gameState.direction === 1 ? "clockwise" : "counter-clockwise"}
      `

      // Get AI move
      const aiMove = await getAIMove(gameDescription)

      // Simulate thinking time
      setTimeout(() => {
        // Process AI move
        const cardIndex = Number.parseInt(aiMove.cardIndex || "0")

        if (isNaN(cardIndex) || cardIndex < 0 || cardIndex >= currentPlayer.hand.length) {
          // If AI returned invalid move, make a random valid move
          makeRandomMove()
        } else {
          const card = currentPlayer.hand[cardIndex]

          // Check if the card is valid to play
          if (isValidMove(card, topCard, currentColor, gameState.drawCount > 0)) {
            playCard(cardIndex, aiMove.chosenColor)
          } else {
            // AI chose an invalid card, draw a card
            drawCard()
          }
        }

        setAiThinking(false)
      }, 1500)
    } catch (error) {
      console.error("Error getting AI move:", error)
      // Fallback to random move
      makeRandomMove()
      setAiThinking(false)
    }
  }

  // Make a random valid move
  const makeRandomMove = () => {
    const currentPlayer = gameState.players[gameState.currentPlayer]
    const topCard = gameState.discardPile[gameState.discardPile.length - 1]
    const currentColor = gameState.currentColor || topCard.color

    // Find valid cards to play
    const validCardIndices = currentPlayer.hand
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => isValidMove(card, topCard, currentColor, gameState.drawCount > 0))
      .map(({ index }) => index)

    if (validCardIndices.length > 0) {
      // Play a random valid card
      const randomIndex = Math.floor(Math.random() * validCardIndices.length)
      const cardIndex = validCardIndices[randomIndex]
      const card = currentPlayer.hand[cardIndex]

      // Choose a random color for wild cards
      let chosenColor = null
      if (card.type === "wild" || card.type === "wild-draw-four") {
        const colors = ["red", "blue", "green", "yellow"]
        chosenColor = colors[Math.floor(Math.random() * colors.length)]
      }

      // AI with one card left says UNO
      if (currentPlayer.hand.length === 2) {
        setGameLog((logs) => [...logs, `${currentPlayer.name} says UNO!`])

        toast({
          title: "UNO!",
          description: `${currentPlayer.name} has only one card left!`,
        })
      }

      playCard(cardIndex, chosenColor)
    } else {
      // No valid cards, draw a card
      drawCard()
    }
  }

  // Play a card
  const playCard = (cardIndex: number, chosenColor?: string | null) => {
    setGameState((prev) => {
      const currentPlayerIndex = prev.currentPlayer
      const currentPlayer = prev.players[currentPlayerIndex]

      // Get the card to play
      const card = currentPlayer.hand[cardIndex]

      // Remove the card from the player's hand
      const updatedHand = [...currentPlayer.hand]
      updatedHand.splice(cardIndex, 1)

      // Update the player's hand
      const updatedPlayers = [...prev.players]
      updatedPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        hand: updatedHand,
      }

      // Add the card to the discard pile
      const updatedDiscardPile = [...prev.discardPile, card]

      // Check if the player has won
      let winner = null
      if (updatedHand.length === 0) {
        winner = currentPlayerIndex

        // Add to game log
        setGameLog((logs) => [...logs, `${currentPlayer.name} wins the game!`])
      } else if (updatedHand.length === 1 && currentPlayerIndex === 0 && !unoCalled) {
        // Human player with one card left should call UNO
        setUnoCalled(true)

        // UNO call achievement
        if (!achievements.find((a) => a.id === "uno_call")?.unlocked) {
          const updatedAchievements = unlockAchievement("uno_call", achievements)
          setAchievements(updatedAchievements)
          setNewAchievement(updatedAchievements.find((a) => a.id === "uno_call") || null)

          // Show achievement notification
          toast({
            title: "Achievement Unlocked!",
            description: "Last Card Standing: Successfully call UNO",
          })
        }
      }

      // Add to game log
      setGameLog((logs) => [...logs, `${currentPlayer.name} played ${card.color || ""} ${card.value || card.type}.`])

      // Update stats
      setCardsPlayedCount((count) => count + 1)
      if (card.type && card.type !== "wild" && card.type !== "wild-draw-four") {
        setSpecialCardsPlayedCount((count) => count + 1)
      }
      if (card.type === "wild" || card.type === "wild-draw-four") {
        setWildCardsPlayedCount((count) => count + 1)
      }

      // Handle special cards
      let direction = prev.direction
      let nextPlayerIndex = getNextPlayer(currentPlayerIndex, direction, updatedPlayers.length)
      let drawCount = prev.drawCount
      const skipNextPlayer = false
      let currentColor = prev.currentColor

      switch (card.type) {
        case "skip":
          // Skip the next player
          nextPlayerIndex = getNextPlayer(nextPlayerIndex, direction, updatedPlayers.length)
          setGameLog((logs) => [...logs, `${updatedPlayers[nextPlayerIndex].name}'s turn is skipped.`])
          break

        case "reverse":
          // Reverse the direction
          direction = -direction
          // With 2 players, reverse acts like skip
          if (updatedPlayers.length === 2) {
            nextPlayerIndex = currentPlayerIndex
          } else {
            nextPlayerIndex = getNextPlayer(currentPlayerIndex, direction, updatedPlayers.length)
          }
          setGameLog((logs) => [...logs, `Direction is reversed.`])
          break

        case "draw-two":
          // Next player draws 2 cards
          drawCount += 2
          setGameLog((logs) => [...logs, `${updatedPlayers[nextPlayerIndex].name} must draw 2 cards.`])
          break

        case "wild":
          // Set the chosen color
          currentColor = chosenColor || "red"
          setGameLog((logs) => [...logs, `${currentPlayer.name} changes color to ${currentColor}.`])
          break

        case "wild-draw-four":
          // Next player draws 4 cards
          drawCount += 4
          // Set the chosen color
          currentColor = chosenColor || "red"
          setGameLog((logs) => [
            ...logs,
            `${currentPlayer.name} changes color to ${currentColor}.`,
            `${updatedPlayers[nextPlayerIndex].name} must draw 4 cards.`,
          ])
          break
      }

      return {
        ...prev,
        players: updatedPlayers,
        discardPile: updatedDiscardPile,
        currentPlayer: nextPlayerIndex,
        direction,
        winner,
        currentColor: card.color || currentColor,
        drawCount,
        skipNextPlayer,
      }
    })

    // Reset selected card and color picker
    setSelectedCard(null)
    setShowColorPicker(false)
  }

  // Draw a card
  const drawCard = () => {
    setGameState((prev) => {
      const currentPlayerIndex = prev.currentPlayer
      const currentPlayer = prev.players[currentPlayerIndex]

      // Check if we need to reshuffle
      let deck = [...prev.deck]
      let discardPile = [...prev.discardPile]

      if (deck.length === 0) {
        // Keep the top card
        const topCard = discardPile.pop()!

        // Shuffle the discard pile and make it the new deck
        deck = shuffleDeck([...discardPile])
        discardPile = [topCard]

        setGameLog((logs) => [...logs, `Deck reshuffled.`])
      }

      // Determine how many cards to draw
      const cardsToDraw = prev.drawCount > 0 ? prev.drawCount : 1

      // Draw cards
      const drawnCards: UnoCardType[] = []
      for (let i = 0; i < cardsToDraw; i++) {
        if (deck.length > 0) {
          drawnCards.push(deck.pop()!)
        }
      }

      // Add the drawn cards to the player's hand
      const updatedHand = [...currentPlayer.hand, ...drawnCards]

      // Update the player's hand
      const updatedPlayers = [...prev.players]
      updatedPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        hand: updatedHand,
      }

      // Update stats
      setCardsDrawnCount((count) => count + cardsToDraw)
      setMaxCardCount(Math.max(maxCardCount, updatedHand.length))

      // Add to game log
      setGameLog((logs) => [...logs, `${currentPlayer.name} drew ${cardsToDraw} card${cardsToDraw > 1 ? "s" : ""}.`])

      // Determine the next player
      let nextPlayerIndex = currentPlayerIndex

      // If we had to draw cards due to a +2 or +4, the turn passes
      // Otherwise, check if the drawn card can be played
      if (
        prev.drawCount > 0 ||
        !isValidMove(
          drawnCards[0],
          discardPile[discardPile.length - 1],
          prev.currentColor || discardPile[discardPile.length - 1].color,
          false,
        )
      ) {
        nextPlayerIndex = getNextPlayer(currentPlayerIndex, prev.direction, updatedPlayers.length)
      }

      return {
        ...prev,
        players: updatedPlayers,
        deck,
        discardPile,
        currentPlayer: nextPlayerIndex,
        drawCount: 0,
      }
    })

    // Reset selected card
    setSelectedCard(null)
  }

  // Handle card selection
  const handleCardSelect = (index: number) => {
    const currentPlayer = gameState.players[gameState.currentPlayer]

    // Only allow selection if it's the human player's turn
    if (!currentPlayer.isHuman || gameState.winner !== null) return

    const card = currentPlayer.hand[index]
    const topCard = gameState.discardPile[gameState.discardPile.length - 1]
    const currentColor = gameState.currentColor || topCard.color

    // Check if the card is valid to play
    if (isValidMove(card, topCard, currentColor, gameState.drawCount > 0)) {
      setSelectedCard(index)

      // If it's a wild card, show the color picker
      if (card.type === "wild" || card.type === "wild-draw-four") {
        setShowColorPicker(true)
      } else {
        // Otherwise, play the card
        playCard(index)
      }
    } else {
      toast({
        title: "Invalid Move",
        description: "This card cannot be played now.",
        variant: "destructive",
      })
    }
  }

  // Handle color selection for wild cards
  const handleColorSelect = (color: string) => {
    if (selectedCard !== null) {
      playCard(selectedCard, color)
    }
    setShowColorPicker(false)
  }

  // Call UNO
  const callUno = () => {
    if (gameState.players[0].hand.length === 1 && !unoCalled) {
      setUnoCalled(true)
      setGameLog((logs) => [...logs, `You called UNO!`])

      toast({
        title: "UNO!",
        description: "You called UNO!",
      })

      // UNO call achievement
      if (!achievements.find((a) => a.id === "uno_call")?.unlocked) {
        const updatedAchievements = unlockAchievement("uno_call", achievements)
        setAchievements(updatedAchievements)
        setNewAchievement(updatedAchievements.find((a) => a.id === "uno_call") || null)

        // Show achievement notification
        toast({
          title: "Achievement Unlocked!",
          description: "Last Card Standing: Successfully call UNO",
        })
      }
    } else if (gameState.players[0].hand.length !== 1) {
      toast({
        title: "Invalid UNO Call",
        description: "You can only call UNO when you have one card left.",
        variant: "destructive",
      })
    }
  }

  // Get the current top card
  const getTopCard = () => {
    if (gameState.discardPile.length === 0) return null
    return gameState.discardPile[gameState.discardPile.length - 1]
  }

  return (
    <div className="w-full max-w-6xl">
      <div className="flex flex-col gap-6">
        {/* Game board */}
        <Card className="p-4 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Game Board</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setShowStats(true)} title="Game Statistics">
                <BarChart className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowAchievements(true)} title="Achievements">
                <Award className="w-4 h-4" />
              </Button>
              <ThemeToggle />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Left side - Game info */}
            <div className="w-full md:w-1/4">
              <div className="flex flex-col gap-4">
                {/* Current player */}
                <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Player</p>
                  <Badge
                    className={`${
                      gameState.players[gameState.currentPlayer].isHuman ? "bg-purple-500" : "bg-cyan-500"
                    }`}
                  >
                    {gameState.players[gameState.currentPlayer].name}
                  </Badge>

                  {aiThinking && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 animate-pulse">AI is thinking...</p>
                  )}
                </div>

                {/* Game stats */}
                <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Cards Left</p>
                  <div className="grid grid-cols-2 gap-2">
                    {gameState.players.map((player) => (
                      <div
                        key={player.id}
                        className={`p-2 rounded-lg border ${
                          gameState.currentPlayer === player.id
                            ? "border-purple-500 dark:border-purple-400"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <span className="text-sm font-medium">{player.name}</span>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{player.hand.length} cards</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current color */}
                {gameState.currentColor && (
                  <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Color</p>
                    <div
                      className={`w-8 h-8 rounded-full bg-${gameState.currentColor}-500 border-2 border-white dark:border-slate-700`}
                    ></div>
                  </div>
                )}

                {/* Game controls */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={drawCard}
                    disabled={
                      gameState.winner !== null || aiThinking || !gameState.players[gameState.currentPlayer].isHuman
                    }
                  >
                    Draw Card
                  </Button>

                  <Button
                    onClick={callUno}
                    disabled={gameState.players[0].hand.length !== 1 || unoCalled}
                    variant="outline"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600"
                  >
                    Call UNO!
                  </Button>

                  <Button onClick={startNewGame} variant="outline">
                    New Game
                  </Button>
                </div>
              </div>
            </div>

            {/* Center - Game board */}
            <div className="w-full md:w-2/4 flex flex-col items-center justify-center">
              {/* Discard pile */}
              <div className="relative mb-8 w-32 h-48">
                <AnimatePresence>
                  {getTopCard() && (
                    <motion.div
                      key={`${getTopCard()?.color}-${getTopCard()?.value || getTopCard()?.type}`}
                      initial={{ scale: 0.8, opacity: 0, y: -50 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0"
                    >
                      <UnoCard card={getTopCard()!} size="lg" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Deck */}
              <div
                className="w-32 h-48 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 border-4 border-white dark:border-slate-700 shadow-lg flex items-center justify-center cursor-pointer"
                onClick={() => {
                  if (gameState.winner === null && !aiThinking && gameState.players[gameState.currentPlayer].isHuman) {
                    drawCard()
                  }
                }}
              >
                <span className="text-white font-bold text-2xl">UNO</span>
              </div>

              {/* Color picker */}
              {showColorPicker && (
                <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-center mb-2">Choose a color:</p>
                  <div className="flex gap-4">
                    {["red", "blue", "green", "yellow"].map((color) => (
                      <button
                        key={color}
                        className={`w-12 h-12 rounded-full bg-${color}-500 border-2 border-white dark:border-slate-700 hover:scale-110 transition-transform`}
                        onClick={() => handleColorSelect(color)}
                      ></button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Game log */}
            <div className="w-full md:w-1/4">
              <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg h-full">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Game Log</p>
                <div className="max-h-60 overflow-y-auto text-xs space-y-1">
                  {gameLog.map((log, index) => (
                    <div key={index} className="border-b border-slate-100 dark:border-slate-800 pb-1">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Player hand */}
        <Card className="p-4 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Your Hand</h2>
          <PlayerHand
            cards={gameState.players[0].hand}
            onCardSelect={handleCardSelect}
            isActive={gameState.currentPlayer === 0 && gameState.winner === null}
          />
        </Card>
      </div>

      {/* Winner Modal */}
      <WinnerModal
        isOpen={showWinnerModal}
        winner={gameState.winner !== null ? gameState.players[gameState.winner].name : ""}
        onClose={() => setShowWinnerModal(false)}
        onNewGame={startNewGame}
      />

      {/* Achievements Panel */}
      <AchievementsPanel
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
        newAchievement={newAchievement}
      />

      {/* Stats Panel */}
      <StatsPanel isOpen={showStats} onClose={() => setShowStats(false)} />
    </div>
  )
}
