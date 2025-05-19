"use client"

import { useState, useEffect, useRef } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { GameMove } from "@/components/game-move"
import { GameResult } from "@/components/game-result"
import { Scoreboard } from "@/components/scoreboard"
import { ParticleEffect } from "@/components/particle-effect"
import { GameStats } from "@/components/game-stats"
import { Achievements, type Achievement } from "@/components/achievements"
import { GameModeSelector, type GameMode } from "@/components/game-mode-selector"
import { playGame } from "./actions"
import { useSound } from "@/lib/sound-manager"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, BarChart2, Trophy, Menu, X, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

type Move = "rock" | "paper" | "scissors" | "lizard" | "spock"
type GameState = "choosing" | "result" | "mode-select"

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("choosing")
  const [gameMode, setGameMode] = useState<GameMode>("classic")
  const [userMove, setUserMove] = useState<Move | null>(null)
  const [aiMove, setAiMove] = useState<Move | null>(null)
  const [result, setResult] = useState<"win" | "lose" | "draw" | null>(null)
  const [comment, setComment] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [newAchievements, setNewAchievements] = useState<string[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const soundManager = useSound()

  const [stats, setStats] = useState({
    user: 0,
    ai: 0,
    draws: 0,
    moveStats: {
      rock: 0,
      paper: 0,
      scissors: 0,
      lizard: 0,
      spock: 0,
    },
    aiMoveStats: {
      rock: 0,
      paper: 0,
      scissors: 0,
      lizard: 0,
      spock: 0,
    },
    gameHistory: [] as {
      userMove: string
      aiMove: string
      result: string
      timestamp: number
    }[],
  })

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first_win",
      name: "First Victory",
      description: "Win your first game against the AI",
      icon: "trophy",
      unlocked: false,
      rarity: "common",
    },
    {
      id: "winning_streak",
      name: "On Fire",
      description: "Win 3 games in a row",
      icon: "zap",
      unlocked: false,
      progress: 0,
      maxProgress: 3,
      rarity: "uncommon",
    },
    {
      id: "rock_fan",
      name: "Rock Solid",
      description: "Play rock 10 times",
      icon: "target",
      unlocked: false,
      progress: 0,
      maxProgress: 10,
      rarity: "common",
    },
    {
      id: "paper_fan",
      name: "Paper Trail",
      description: "Play paper 10 times",
      icon: "target",
      unlocked: false,
      progress: 0,
      maxProgress: 10,
      rarity: "common",
    },
    {
      id: "scissors_fan",
      name: "Scissor Wizard",
      description: "Play scissors 10 times",
      icon: "target",
      unlocked: false,
      progress: 0,
      maxProgress: 10,
      rarity: "common",
    },
    {
      id: "master_strategist",
      name: "Master Strategist",
      description: "Win 10 games total",
      icon: "crown",
      unlocked: false,
      progress: 0,
      maxProgress: 10,
      rarity: "rare",
    },
    {
      id: "comeback_king",
      name: "Comeback King",
      description: "Win after losing 3 games in a row",
      icon: "crown",
      unlocked: false,
      secret: true,
      rarity: "epic",
    },
    {
      id: "mind_reader",
      name: "Mind Reader",
      description: "Win 5 games in Psychic Mode",
      icon: "star",
      unlocked: false,
      progress: 0,
      maxProgress: 5,
      rarity: "rare",
    },
    {
      id: "speed_demon",
      name: "Speed Demon",
      description: "Win a Blitz Mode game with more than 2 seconds left",
      icon: "zap",
      unlocked: false,
      secret: true,
      rarity: "legendary",
    },
  ])

  const [winStreak, setWinStreak] = useState(0)
  const [loseStreak, setLoseStreak] = useState(0)

  useEffect(() => {
    const savedStats = localStorage.getItem("rps-stats")
    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats)
      
        setStats({
          user: parsedStats.user || 0,
          ai: parsedStats.ai || 0,
          draws: parsedStats.draws || 0,
          moveStats: parsedStats.moveStats || {
            rock: 0,
            paper: 0,
            scissors: 0,
            lizard: 0,
            spock: 0,
          },
          aiMoveStats: parsedStats.aiMoveStats || {
            rock: 0,
            paper: 0,
            scissors: 0,
            lizard: 0,
            spock: 0,
          },
          gameHistory: parsedStats.gameHistory || [],
        })
      } catch (e) {
        console.error("Error parsing stats from localStorage:", e)
      }
    }

    const savedAchievements = localStorage.getItem("rps-achievements")
    if (savedAchievements) {
      try {
        setAchievements(JSON.parse(savedAchievements))
      } catch (e) {
        console.error("Error parsing achievements from localStorage:", e)
      }
    }

    const savedWinStreak = localStorage.getItem("rps-win-streak")
    if (savedWinStreak) {
      setWinStreak(Number.parseInt(savedWinStreak) || 0)
    }

    const savedLoseStreak = localStorage.getItem("rps-lose-streak")
    if (savedLoseStreak) {
      setLoseStreak(Number.parseInt(savedLoseStreak) || 0)
    }

    const savedGameMode = localStorage.getItem("rps-game-mode")
    if (savedGameMode) {
      setGameMode(savedGameMode as GameMode)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("rps-stats", JSON.stringify(stats))
  }, [stats])

  useEffect(() => {
    localStorage.setItem("rps-achievements", JSON.stringify(achievements))
  }, [achievements])

  useEffect(() => {
    localStorage.setItem("rps-win-streak", winStreak.toString())
  }, [winStreak])

  useEffect(() => {
    localStorage.setItem("rps-lose-streak", loseStreak.toString())
  }, [loseStreak])

  useEffect(() => {
    localStorage.setItem("rps-game-mode", gameMode)
  }, [gameMode])

  
  useEffect(() => {
    if (gameMode === "blitz" && gameState === "choosing" && countdown !== null) {
      if (countdown > 0) {
        countdownRef.current = setTimeout(() => {
          setCountdown(countdown - 1)
        }, 1000)
      } else {
        
        const moves: Move[] = ["rock", "paper", "scissors"]
        handleMoveSelect(moves[Math.floor(Math.random() * moves.length)])
      }
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current)
      }
    }
  }, [countdown, gameMode, gameState])


  const checkAchievements = (userMove: Move, aiMove: Move, result: "win" | "lose" | "draw") => {
    const newUnlocked: string[] = []
    const updatedAchievements = [...achievements]

    
    const firstWinAchievement = updatedAchievements.find((a) => a.id === "first_win")
    if (firstWinAchievement && !firstWinAchievement.unlocked && result === "win") {
      firstWinAchievement.unlocked = true
      firstWinAchievement.unlockedAt = Date.now()
      newUnlocked.push(firstWinAchievement.id)
    }

    
    const winStreakAchievement = updatedAchievements.find((a) => a.id === "winning_streak")
    if (winStreakAchievement) {
      if (result === "win") {
        winStreakAchievement.progress = (winStreakAchievement.progress || 0) + 1
        if (
          winStreakAchievement.progress >= (winStreakAchievement.maxProgress || 3) &&
          !winStreakAchievement.unlocked
        ) {
          winStreakAchievement.unlocked = true
          winStreakAchievement.unlockedAt = Date.now()
          newUnlocked.push(winStreakAchievement.id)
        }
      } else {
        winStreakAchievement.progress = 0
      }
    }

    
    const moveAchievements = {
      rock: updatedAchievements.find((a) => a.id === "rock_fan"),
      paper: updatedAchievements.find((a) => a.id === "paper_fan"),
      scissors: updatedAchievements.find((a) => a.id === "scissors_fan"),
    }

    const currentMoveAchievement = moveAchievements[userMove as keyof typeof moveAchievements]
    if (currentMoveAchievement) {
      currentMoveAchievement.progress = (currentMoveAchievement.progress || 0) + 1
      if (
        currentMoveAchievement.progress >= (currentMoveAchievement.maxProgress || 10) &&
        !currentMoveAchievement.unlocked
      ) {
        currentMoveAchievement.unlocked = true
        currentMoveAchievement.unlockedAt = Date.now()
        newUnlocked.push(currentMoveAchievement.id)
      }
    }

    
    const masterStrategistAchievement = updatedAchievements.find((a) => a.id === "master_strategist")
    if (masterStrategistAchievement && result === "win") {
      masterStrategistAchievement.progress = (masterStrategistAchievement.progress || 0) + 1
      if (
        masterStrategistAchievement.progress >= (masterStrategistAchievement.maxProgress || 10) &&
        !masterStrategistAchievement.unlocked
      ) {
        masterStrategistAchievement.unlocked = true
        masterStrategistAchievement.unlockedAt = Date.now()
        newUnlocked.push(masterStrategistAchievement.id)
      }
    }

    
    const comebackKingAchievement = updatedAchievements.find((a) => a.id === "comeback_king")
    if (comebackKingAchievement && !comebackKingAchievement.unlocked && result === "win" && loseStreak >= 3) {
      comebackKingAchievement.unlocked = true
      comebackKingAchievement.unlockedAt = Date.now()
      newUnlocked.push(comebackKingAchievement.id)
    }


    const mindReaderAchievement = updatedAchievements.find((a) => a.id === "mind_reader")
    if (mindReaderAchievement && gameMode === "psychic" && result === "win") {
      mindReaderAchievement.progress = (mindReaderAchievement.progress || 0) + 1
      if (
        mindReaderAchievement.progress >= (mindReaderAchievement.maxProgress || 5) &&
        !mindReaderAchievement.unlocked
      ) {
        mindReaderAchievement.unlocked = true
        mindReaderAchievement.unlockedAt = Date.now()
        newUnlocked.push(mindReaderAchievement.id)
      }
    }

    
    const speedDemonAchievement = updatedAchievements.find((a) => a.id === "speed_demon")
    if (
      speedDemonAchievement &&
      !speedDemonAchievement.unlocked &&
      gameMode === "blitz" &&
      result === "win" &&
      countdown !== null &&
      countdown > 2
    ) {
      speedDemonAchievement.unlocked = true
      speedDemonAchievement.unlockedAt = Date.now()
      newUnlocked.push(speedDemonAchievement.id)
    }

    setAchievements(updatedAchievements)

    if (newUnlocked.length > 0) {
      setNewAchievements(newUnlocked)
      setTimeout(() => {
        setShowAchievements(true)
      }, 1500)
    }
  }

  const handleMoveSelect = async (move: Move) => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
    }

    setUserMove(move)
    setLoading(true)

    if (soundManager) {
      soundManager.playSound(move)
    }

    
    setStats((prev) => ({
      ...prev,
      moveStats: {
        ...prev.moveStats,
        [move]: prev.moveStats[move as keyof typeof prev.moveStats] + 1,
      },
    }))

    try {
      const gameResult = await playGame(move)

      const aiMove = gameResult.aiMove as Move
      setAiMove(aiMove)
      setResult(gameResult.result)
      setComment(gameResult.comment)

      
      setStats((prev) => ({
        ...prev,
        aiMoveStats: {
          ...prev.aiMoveStats,
          [aiMove]: prev.aiMoveStats[aiMove as keyof typeof prev.aiMoveStats] + 1,
        },
      }))

      
      setStats((prev) => ({
        ...prev,
        gameHistory: [
          ...prev.gameHistory,
          {
            userMove: move,
            aiMove,
            result: gameResult.result,
            timestamp: Date.now(),
          },
        ].slice(-50), 
      }))

      
      if (gameResult.result === "win") {
        setStats((prev) => ({ ...prev, user: prev.user + 1 }))
        setWinStreak((prev) => prev + 1)
        setLoseStreak(0)
        if (soundManager) {
          soundManager.playSound("win")
        }
      } else if (gameResult.result === "lose") {
        setStats((prev) => ({ ...prev, ai: prev.ai + 1 }))
        setLoseStreak((prev) => prev + 1)
        setWinStreak(0)
        if (soundManager) {
          soundManager.playSound("lose")
        }
      } else {
        setStats((prev) => ({ ...prev, draws: prev.draws + 1 }))
        setWinStreak(0)
        setLoseStreak(0)
        if (soundManager) {
          soundManager.playSound("draw")
        }
      }

      
      checkAchievements(move, aiMove, gameResult.result)

      setGameState("result")
    } catch (error) {
      console.error("Error playing game:", error)
      
      const moves: Move[] = ["rock", "paper", "scissors"]
      const randomAiMove = moves[Math.floor(Math.random() * moves.length)]
      setAiMove(randomAiMove)

      
      let gameResult: "win" | "lose" | "draw"
      if (move === randomAiMove) {
        gameResult = "draw"
        setStats((prev) => ({ ...prev, draws: prev.draws + 1 }))
        setWinStreak(0)
        setLoseStreak(0)
        if (soundManager) {
          soundManager.playSound("draw")
        }
      } else if (
        (move === "rock" && randomAiMove === "scissors") ||
        (move === "paper" && randomAiMove === "rock") ||
        (move === "scissors" && randomAiMove === "paper")
      ) {
        gameResult = "win"
        setStats((prev) => ({ ...prev, user: prev.user + 1 }))
        setWinStreak((prev) => prev + 1)
        setLoseStreak(0)
        if (soundManager) {
          soundManager.playSound("win")
        }
      } else {
        gameResult = "lose"
        setStats((prev) => ({ ...prev, ai: prev.ai + 1 }))
        setLoseStreak((prev) => prev + 1)
        setWinStreak(0)
        if (soundManager) {
          soundManager.playSound("lose")
        }
      }

      
      setStats((prev) => ({
        ...prev,
        aiMoveStats: {
          ...prev.aiMoveStats,
          [randomAiMove]: prev.aiMoveStats[randomAiMove as keyof typeof prev.aiMoveStats] + 1,
        },
      }))

      
      setStats((prev) => ({
        ...prev,
        gameHistory: [
          ...prev.gameHistory,
          {
            userMove: move,
            aiMove: randomAiMove,
            result: gameResult,
            timestamp: Date.now(),
          },
        ].slice(-50), 
      }))

      setResult(gameResult)
      setComment("Connection error, but the game must go on!")

      
      checkAchievements(move, randomAiMove, gameResult)

      setGameState("result")
    } finally {
      setLoading(false)
    }
  }

  const resetGame = () => {
    setUserMove(null)
    setAiMove(null)
    setResult(null)
    setComment("")

    if (gameMode === "blitz") {
      setCountdown(5) 
    } else {
      setCountdown(null)
    }

    setGameState("choosing")
  }

  const resetScores = () => {
    setStats({
      user: 0,
      ai: 0,
      draws: 0,
      moveStats: {
        rock: 0,
        paper: 0,
        scissors: 0,
        lizard: 0,
        spock: 0,
      },
      aiMoveStats: {
        rock: 0,
        paper: 0,
        scissors: 0,
        lizard: 0,
        spock: 0,
      },
      gameHistory: [],
    })
    setWinStreak(0)
    setLoseStreak(0)
  }

  const handleSelectGameMode = (mode: GameMode) => {
    setGameMode(mode)
    setGameState("choosing")
    localStorage.setItem("rps-game-mode", mode)

    if (mode === "blitz") {
      setCountdown(5)
    }

    if (soundManager) {
      soundManager.playSound("click")
    }
  }

  const getAvailableMoves = (): Move[] => {
    if (gameMode === "advanced") {
      return ["rock", "paper", "scissors", "lizard", "spock"]
    }
    return ["rock", "paper", "scissors"]
  }

  return (
    <main className="min-h-screen grid-pattern relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="glow-effect absolute top-1/4 left-1/4 w-1/2 h-1/2"></div>
      </div>

      <ParticleEffect type={result || "draw"} active={gameState === "result" && result !== null} />

      <div className="container max-w-4xl mx-auto py-8 px-4">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
              SHAPE RPS
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full md:hidden">
                  <Menu className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-4">
                  <Button variant="outline" className="justify-start" onClick={() => setGameState("mode-select")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Change Game Mode
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => setShowStats(true)}>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Statistics
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => setShowAchievements(true)}>
                    <Trophy className="mr-2 h-4 w-4" />
                    Achievements
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={resetScores}>
                    <X className="mr-2 h-4 w-4" />
                    Reset Scores
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden md:flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Settings className="h-[1.2rem] w-[1.2rem]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Game Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setGameState("mode-select")}>Change Game Mode</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowStats(true)}>Statistics</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAchievements(true)}>Achievements</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={resetScores}>Reset Scores</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="mb-8">
          <Scoreboard userScore={stats.user} aiScore={stats.ai} draws={stats.draws} />
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg border border-primary/20">
          <AnimatePresence mode="wait">
            {gameState === "mode-select" && (
              <div className="py-4">
                <GameModeSelector onSelect={handleSelectGameMode} onClose={() => setGameState("choosing")} />
              </div>
            )}

            {gameState === "choosing" && (
              <motion.div
                key="choosing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-8"
              >
                <div className="flex flex-col items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-center">
                    {gameMode === "classic" && "Classic Rock Paper Scissors"}
                    {gameMode === "advanced" && "Rock Paper Scissors Lizard Spock"}
                    {gameMode === "psychic" && "Psychic Mode: Outsmart the AI"}
                    {gameMode === "blitz" && "Blitz Mode: Beat the Clock"}
                  </h2>

                  {gameMode === "blitz" && countdown !== null && (
                    <div className={`text-4xl font-bold ${countdown <= 2 ? "text-red-500 animate-pulse" : ""}`}>
                      {countdown}
                    </div>
                  )}

                  {gameMode === "advanced" && (
                    <p className="text-center text-muted-foreground max-w-md">
                      Scissors cuts Paper, Paper covers Rock, Rock crushes Lizard, Lizard poisons Spock, Spock smashes
                      Scissors, Scissors decapitates Lizard, Lizard eats Paper, Paper disproves Spock, Spock vaporizes
                      Rock, and as it always has, Rock crushes Scissors.
                    </p>
                  )}

                  {gameMode === "psychic" && (
                    <p className="text-center text-muted-foreground max-w-md">
                      The AI learns your patterns as you play. Can you be unpredictable enough to win?
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-6 md:gap-10">
                  {getAvailableMoves().map((move) => (
                    <div key={move} className="flex flex-col items-center mb-2">
                      <GameMove move={move} onClick={() => handleMoveSelect(move)} disabled={loading} />
                    </div>
                  ))}
                </div>

                {loading && <div className="text-center text-muted-foreground animate-pulse">AI is thinking...</div>}

                <div className="text-center text-sm text-muted-foreground mt-4">
                  <Button variant="outline" size="sm" onClick={() => setGameState("mode-select")}>
                    Change Game Mode
                  </Button>
                </div>
              </motion.div>
            )}

            {gameState === "result" && userMove && aiMove && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <GameResult
                  userMove={userMove}
                  aiMove={aiMove}
                  result={result}
                  comment={comment}
                  onPlayAgain={resetGame}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>Copyright Shapes, Inc. Made using Shapes, Inc. API</p>
          <div className="flex justify-center gap-2 mt-2">
            <ThemeToggle />
          </div>
        </footer>
      </div>

      
      <AnimatePresence>
        {showStats && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
            <GameStats stats={stats} onClose={() => setShowStats(false)} />
          </div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {showAchievements && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
            <Achievements
              achievements={achievements}
              onClose={() => {
                setShowAchievements(false)
                setNewAchievements([])
              }}
              newUnlocked={newAchievements}
            />
          </div>
        )}
      </AnimatePresence>
    
      <AnimatePresence>
        {newAchievements.length > 0 && !showAchievements && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-card p-4 rounded-lg shadow-lg border border-primary z-50 max-w-sm"
          >
            <div className="flex items-start gap-4">
              <Trophy className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-bold">Achievement Unlocked!</h3>
                <p className="text-sm text-muted-foreground">
                  {newAchievements.length === 1
                    ? achievements.find((a) => a.id === newAchievements[0])?.name
                    : `You unlocked ${newAchievements.length} achievements!`}
                </p>
                <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => setShowAchievements(true)}>
                  View Details
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-full"
                onClick={() => setNewAchievements([])}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
