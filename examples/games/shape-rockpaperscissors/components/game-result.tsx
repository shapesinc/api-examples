"use client"

import { cn } from "@/lib/utils"
import { GameMove } from "./game-move"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

type GameResultProps = {
  userMove: "rock" | "paper" | "scissors" | "lizard" | "spock"
  aiMove: "rock" | "paper" | "scissors" | "lizard" | "spock"
  result: "win" | "lose" | "draw"
  comment: string
  onPlayAgain: () => void
}

export function GameResult({ userMove, aiMove, result, comment, onPlayAgain }: GameResultProps) {
  const resultText = {
    win: "You Win!",
    lose: "AI Wins!",
    draw: "It's a Draw!",
  }

  const resultColor = {
    win: "text-green-500",
    lose: "text-red-500",
    draw: "text-yellow-500",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-8"
    >
      <h2 className={cn("text-3xl font-bold", resultColor[result])}>{resultText[result]}</h2>

      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-medium">You</span>
          <GameMove move={userMove} size="lg" winner={result === "win"} loser={result === "lose"} showLabel={false} />
        </div>

        <div className="text-2xl font-bold">VS</div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-medium">AI</span>
          <GameMove move={aiMove} size="lg" winner={result === "lose"} loser={result === "win"} showLabel={false} />
        </div>
      </div>

      <div className="text-center text-lg italic text-muted-foreground max-w-full px-4">"{comment}"</div>

      <Button onClick={onPlayAgain} size="lg" className="mt-4">
        Play Again
      </Button>
    </motion.div>
  )
}
