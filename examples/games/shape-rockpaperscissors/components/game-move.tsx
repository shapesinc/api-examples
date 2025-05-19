"use client"

import { cn } from "@/lib/utils"
import { ScissorsIcon, PaperclipIcon as PaperIcon, RockingChairIcon as RockIcon } from "lucide-react"

type GameMoveProps = {
  move: "rock" | "paper" | "scissors" | "lizard" | "spock"
  selected?: boolean
  winner?: boolean
  loser?: boolean
  onClick?: () => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function GameMove({
  move,
  selected = false,
  winner = false,
  loser = false,
  onClick,
  disabled = false,
  size = "md",
  showLabel = true,
}: GameMoveProps) {
  // Increased sizes for better visibility
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  }

  const iconSizes = {
    sm: 32,
    md: 48,
    lg: 64,
  }

  const getIcon = () => {
    switch (move) {
      case "rock":
        return <RockIcon size={iconSizes[size]} />
      case "paper":
        return <PaperIcon size={iconSizes[size]} />
      case "scissors":
        return <ScissorsIcon size={iconSizes[size]} />
      // Add support for lizard and spock icons
      case "lizard":
        return <span className="text-3xl">🦎</span>
      case "spock":
        return <span className="text-3xl">🖖</span>
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "rounded-full flex items-center justify-center transition-all duration-300",
          sizeClasses[size],
          "border-4",
          selected ? "border-primary" : "border-muted-foreground/30",
          winner ? "bg-green-500/20 border-green-500" : "",
          loser ? "bg-red-500/20 border-red-500" : "",
          !disabled && !selected && "hover:border-primary/50 hover:scale-105",
          disabled && "opacity-70 cursor-not-allowed",
        )}
      >
        <div className={cn("text-foreground", winner ? "text-green-500" : "", loser ? "text-red-500" : "")}>
          {getIcon()}
        </div>
      </button>
      {showLabel && <span className="text-sm font-medium capitalize">{move}</span>}
    </div>
  )
}
