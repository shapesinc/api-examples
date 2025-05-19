"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import GameBoard from "@/components/game-board"
import ThemeToggle from "@/components/theme-toggle"
import { getAIMove } from "@/lib/shapes-ai"
import { type GameState, PLAYER_START_POSITIONS, isValidMove } from "@/lib/game-types"

export default function LudoGame() {
  const { toast } = useToast()
  const [gameState, setGameState] = useState<GameState>({
    players: [
      {
        id: 0,
        color: "red",
        isHuman: true,
        pawns: initializePawns(),
        score: 0,
        startPosition: PLAYER_START_POSITIONS.red,
      },
      {
        id: 1,
        color: "green",
        isHuman: false,
        pawns: initializePawns(),
        score: 0,
        startPosition: PLAYER_START_POSITIONS.green,
      },
      {
        id: 2,
        color: "yellow",
        isHuman: false,
        pawns: initializePawns(),
        score: 0,
        startPosition: PLAYER_START_POSITIONS.yellow,
      },
      {
        id: 3,
        color: "blue",
        isHuman: false,
        pawns: initializePawns(),
        score: 0,
        startPosition: PLAYER_START_POSITIONS.blue,
      },
    ],
    currentPlayer: 0,
    diceValue: 1,
    isRolling: false,
    gameStarted: false,
    winner: null,
    moveHistory: [],
  })
  const [aiThinking, setAiThinking] = useState(false)

  // Initialize pawns for a player
  function initializePawns() {
    return [0, 1, 2, 3].map((id) => ({
      id,
      position: -1, // -1 means in home
      isHome: true,
      isFinished: false,
    }))
  }

  // Effect to handle AI turns automatically
  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayer]

    // If it's AI's turn and the game has started and no one is rolling
    if (
      !currentPlayer.isHuman &&
      gameState.gameStarted &&
      !gameState.isRolling &&
      !aiThinking &&
      gameState.winner === null
    ) {
      // Add a small delay before AI rolls
      const timeoutId = setTimeout(() => {
        rollDice()
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [gameState.currentPlayer, gameState.gameStarted, gameState.isRolling, aiThinking, gameState.winner])

  // Roll the dice
  const rollDice = async () => {
    if (gameState.isRolling || aiThinking || gameState.winner !== null) return

    setGameState((prev) => ({ ...prev, isRolling: true }))

    // Animate dice roll
    const rollDuration = 1000
    const intervalTime = 100
    const iterations = rollDuration / intervalTime

    let count = 0
    const rollInterval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        diceValue: Math.floor(Math.random() * 6) + 1,
      }))

      count++
      if (count >= iterations) {
        clearInterval(rollInterval)
        const finalValue = Math.floor(Math.random() * 6) + 1

        setGameState((prev) => ({
          ...prev,
          diceValue: finalValue,
          isRolling: false,
          gameStarted: true,
        }))

        // Check if current player is AI
        if (!gameState.players[gameState.currentPlayer].isHuman) {
          handleAITurn(finalValue)
        } else {
          // Check if human player has any valid moves
          const currentPlayer = gameState.players[gameState.currentPlayer]
          const hasValidMoves = currentPlayer.pawns.some((pawn) => isValidMove(pawn, finalValue))

          if (!hasValidMoves) {
            toast({
              title: "No valid moves",
              description: "You don't have any valid moves. Your turn will be skipped.",
            })

            // Wait a moment before moving to next player
            setTimeout(() => {
              nextPlayer()
            }, 1500)
          } else {
            // Highlight movable pawns
            toast({
              title: "Your turn",
              description: "Click on a highlighted pawn to move it.",
            })
          }
        }
      }
    }, intervalTime)
  }

  // Handle AI player's turn
  const handleAITurn = async (diceValue: number) => {
    setAiThinking(true)

    try {
      const currentPlayer = gameState.players[gameState.currentPlayer]

      // Check if AI has any valid moves
      const validPawns = currentPlayer.pawns.filter((pawn) => isValidMove(pawn, diceValue))

      if (validPawns.length === 0) {
        // No valid moves, skip turn
        setTimeout(() => {
          nextPlayer()
          setAiThinking(false)
        }, 1500)
        return
      }

      // Create a description of the game state for the AI
      const moveDescription = `
        Player ${currentPlayer.color} rolled a ${diceValue}. 
        Current board state: 
        ${gameState.players
          .map(
            (p) =>
              `${p.color}: ${p.pawns
                .map((pawn) => (pawn.isHome ? "home" : pawn.isFinished ? "finished" : `position ${pawn.position}`))
                .join(", ")}`,
          )
          .join(" | ")}
      `

      const aiMove = await getAIMove(moveDescription)

      // Simulate thinking time
      setTimeout(() => {
        // Process AI move
        const pawnToMove = Number.parseInt(aiMove.pawnId)

        if (isNaN(pawnToMove) || pawnToMove < 0 || pawnToMove > 3) {
          // If AI returned invalid move, make a random valid move
          makeRandomMove(diceValue)
        } else {
          // Check if the AI's chosen pawn can actually move
          const pawn = currentPlayer.pawns.find((p) => p.id === pawnToMove)
          if (pawn && isValidMove(pawn, diceValue)) {
            makeMove(pawnToMove, diceValue)
          } else {
            // AI chose an invalid pawn, make a random valid move
            makeRandomMove(diceValue)
          }
        }

        setAiThinking(false)
      }, 1500)
    } catch (error) {
      console.error("Error getting AI move:", error)
      // Fallback to random move
      makeRandomMove(diceValue)
      setAiThinking(false)
    }
  }

  // Make a random valid move
  const makeRandomMove = (diceValue: number) => {
    const currentPlayer = gameState.players[gameState.currentPlayer]
    const validPawns = currentPlayer.pawns.filter((pawn) => isValidMove(pawn, diceValue))

    if (validPawns.length > 0) {
      const randomPawn = validPawns[Math.floor(Math.random() * validPawns.length)]
      makeMove(randomPawn.id, diceValue)
    } else {
      // No valid moves, go to next player
      nextPlayer()
    }
  }

  // Make a move with a pawn
  const makeMove = (pawnId: number, diceValue: number) => {
    setGameState((prev) => {
      const currentPlayerIndex = prev.currentPlayer
      const currentPlayer = prev.players[currentPlayerIndex]
      const pawnIndex = currentPlayer.pawns.findIndex((p) => p.id === pawnId)

      if (pawnIndex === -1) return prev

      const pawn = currentPlayer.pawns[pawnIndex]

      // Check if move is valid
      if (!isValidMove(pawn, diceValue)) return prev

      // Calculate new position
      let newPosition = pawn.position
      let isHome = pawn.isHome
      let isFinished = pawn.isFinished

      // Moving out of home
      if (pawn.isHome && diceValue === 6) {
        newPosition = 0 // Start at the player's starting position
        isHome = false
      }
      // Moving on the board
      else if (!pawn.isHome && !pawn.isFinished) {
        newPosition += diceValue

        // Check if pawn has completed the circuit and entered home run
        if (newPosition >= 52 && newPosition <= 57) {
          // Pawn is in home run
          if (newPosition === 57) {
            // Pawn has reached the end
            isFinished = true
            currentPlayer.score += 1
          }
        }
      }

      // Update pawn
      const updatedPawns = [...currentPlayer.pawns]
      updatedPawns[pawnIndex] = {
        ...pawn,
        position: newPosition,
        isHome,
        isFinished,
      }

      // Check for captures (sending opponent pawns home)
      const updatedPlayers = [...prev.players]

      if (!isHome && !isFinished && newPosition < 52) {
        // Convert to global position for comparison
        const globalPosition = (newPosition + currentPlayer.startPosition) % 52

        // Check each opponent's pawns
        for (let i = 0; i < updatedPlayers.length; i++) {
          // Skip current player
          if (i === currentPlayerIndex) continue

          const opponent = updatedPlayers[i]
          const updatedOpponentPawns = [...opponent.pawns]
          let captureHappened = false

          // Check each pawn of this opponent
          for (let j = 0; j < updatedOpponentPawns.length; j++) {
            const opponentPawn = updatedOpponentPawns[j]

            // Skip home or finished pawns
            if (opponentPawn.isHome || opponentPawn.isFinished) continue

            // Convert opponent position to global position
            const opponentGlobalPosition = (opponentPawn.position + opponent.startPosition) % 52

            // Safe spots (every 13th spot) are safe from capture
            const isSafeSpot = opponentGlobalPosition % 13 === 0

            // If opponent pawn is at this position and not on a safe spot, capture it
            if (opponentGlobalPosition === globalPosition && !isSafeSpot) {
              updatedOpponentPawns[j] = {
                ...opponentPawn,
                position: -1,
                isHome: true,
                isFinished: false,
              }
              captureHappened = true

              // Show toast for capture
              toast({
                title: "Capture!",
                description: `${currentPlayer.color} captured ${opponent.color}'s pawn!`,
              })
            }
          }

          if (captureHappened) {
            updatedPlayers[i] = {
              ...opponent,
              pawns: updatedOpponentPawns,
            }
          }
        }
      }

      // Update current player's pawns
      updatedPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        pawns: updatedPawns,
        score: updatedPawns.filter((p) => p.isFinished).length,
      }

      // Add to move history
      const moveHistory = [...prev.moveHistory]
      moveHistory.push({
        player: currentPlayerIndex,
        pawn: pawnId,
        diceValue,
        timestamp: new Date().toISOString(),
      })

      // Check for winner (all 4 pawns finished)
      let winner = null
      if (updatedPawns.every((p) => p.isFinished)) {
        winner = currentPlayerIndex
        toast({
          title: "Game Over!",
          description: `${currentPlayer.color.toUpperCase()} wins the game!`,
          variant: "default",
        })
      }

      // If dice value is 6 or a capture happened, player gets another turn
      // Unless they've won
      const nextPlayerIndex =
        winner !== null ? currentPlayerIndex : diceValue === 6 ? currentPlayerIndex : (currentPlayerIndex + 1) % 4

      return {
        ...prev,
        players: updatedPlayers,
        currentPlayer: nextPlayerIndex,
        winner,
        moveHistory,
      }
    })
  }

  // Handle human player selecting a pawn
  const handlePawnSelect = (pawnId: number) => {
    const currentPlayer = gameState.players[gameState.currentPlayer]

    if (!currentPlayer.isHuman || gameState.isRolling || gameState.winner !== null) return

    const pawn = currentPlayer.pawns.find((p) => p.id === pawnId)

    if (!pawn) return

    // Check if move is valid
    if (isValidMove(pawn, gameState.diceValue)) {
      makeMove(pawnId, gameState.diceValue)
    } else {
      toast({
        title: "Invalid Move",
        description: pawn.isHome ? "You need to roll a 6 to move a pawn out of home." : "This pawn cannot be moved.",
        variant: "destructive",
      })
    }
  }

  // Go to next player
  const nextPlayer = () => {
    setGameState((prev) => ({
      ...prev,
      currentPlayer: (prev.currentPlayer + 1) % 4,
    }))
  }

  // Reset the game
  const resetGame = () => {
    setGameState({
      players: [
        {
          id: 0,
          color: "red",
          isHuman: true,
          pawns: initializePawns(),
          score: 0,
          startPosition: PLAYER_START_POSITIONS.red,
        },
        {
          id: 1,
          color: "green",
          isHuman: false,
          pawns: initializePawns(),
          score: 0,
          startPosition: PLAYER_START_POSITIONS.green,
        },
        {
          id: 2,
          color: "yellow",
          isHuman: false,
          pawns: initializePawns(),
          score: 0,
          startPosition: PLAYER_START_POSITIONS.yellow,
        },
        {
          id: 3,
          color: "blue",
          isHuman: false,
          pawns: initializePawns(),
          score: 0,
          startPosition: PLAYER_START_POSITIONS.blue,
        },
      ],
      currentPlayer: 0,
      diceValue: 1,
      isRolling: false,
      gameStarted: false,
      winner: null,
      moveHistory: [],
    })
    setAiThinking(false)
  }

  // Render dice based on value
  const renderDice = () => {
    const diceIcons = [
      <Dice1 key={1} className="w-12 h-12" />,
      <Dice2 key={2} className="w-12 h-12" />,
      <Dice3 key={3} className="w-12 h-12" />,
      <Dice4 key={4} className="w-12 h-12" />,
      <Dice5 key={5} className="w-12 h-12" />,
      <Dice6 key={6} className="w-12 h-12" />,
    ]

    return diceIcons[gameState.diceValue - 1]
  }

  return (
    <div className="w-full max-w-6xl">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-3/4">
          <Card className="p-4 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl">
            <GameBoard gameState={gameState} onPawnSelect={handlePawnSelect} />
          </Card>
        </div>

        <div className="w-full md:w-1/4">
          <Card className="p-4 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Game Controls</h2>
                <ThemeToggle />
              </div>

              <div className="flex flex-col items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Current Player</p>
                  <Badge
                    className={`text-white ${
                      gameState.players[gameState.currentPlayer].color === "red"
                        ? "bg-red-500"
                        : gameState.players[gameState.currentPlayer].color === "green"
                          ? "bg-green-500"
                          : gameState.players[gameState.currentPlayer].color === "yellow"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                    }`}
                  >
                    {gameState.players[gameState.currentPlayer].color.toUpperCase()}
                    {gameState.players[gameState.currentPlayer].isHuman ? " (You)" : " (AI)"}
                  </Badge>
                </div>

                <motion.div
                  className="p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg"
                  animate={{ rotate: gameState.isRolling ? 360 : 0 }}
                  transition={{ duration: 0.5, repeat: gameState.isRolling ? Number.POSITIVE_INFINITY : 0 }}
                >
                  {renderDice()}
                </motion.div>

                <Button
                  onClick={rollDice}
                  disabled={
                    gameState.isRolling ||
                    aiThinking ||
                    gameState.winner !== null ||
                    (gameState.gameStarted && !gameState.players[gameState.currentPlayer].isHuman)
                  }
                  className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                >
                  {gameState.isRolling ? "Rolling..." : "Roll Dice"}
                </Button>

                {aiThinking && (
                  <div className="text-center text-sm text-slate-500 dark:text-slate-400 animate-pulse">
                    AI is thinking...
                  </div>
                )}

                {gameState.winner !== null && (
                  <div className="text-center font-bold text-lg text-purple-500 dark:text-purple-400">
                    {gameState.players[gameState.winner].color.toUpperCase()} WINS!
                  </div>
                )}
              </div>

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
                    <div className={`w-4 h-4 rounded-full inline-block mr-2 bg-${player.color}-500`}></div>
                    <span className="text-sm font-medium">{player.color}</span>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Score: {player.score}/4</div>
                  </div>
                ))}
              </div>

              <Button onClick={resetGame} variant="outline" className="mt-2">
                Reset Game
              </Button>

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Game History</h3>
                <div className="max-h-40 overflow-y-auto text-xs space-y-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                  {gameState.moveHistory.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400">No moves yet</p>
                  ) : (
                    gameState.moveHistory.slice(-5).map((move, index) => (
                      <div key={index} className="border-b border-slate-100 dark:border-slate-800 pb-1">
                        <span className={`font-medium text-${gameState.players[move.player].color}-500`}>
                          {gameState.players[move.player].color}
                        </span>
                        {" moved pawn "}
                        {move.pawn + 1}
                        {" with dice "}
                        {move.diceValue}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
