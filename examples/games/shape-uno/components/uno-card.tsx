"use client"

import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import type { UnoCard as UnoCardType } from "@/lib/game-logic"

interface UnoCardProps {
  card: UnoCardType
  size?: "sm" | "md" | "lg"
  onClick?: () => void
  isActive?: boolean
}

export default function UnoCard({ card, size = "md", onClick, isActive = false }: UnoCardProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Determine card background color
  const getCardColor = () => {
    if (card.type === "wild" || card.type === "wild-draw-four") {
      return "bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500"
    }

    switch (card.color) {
      case "red":
        return "bg-red-500"
      case "blue":
        return "bg-blue-500"
      case "green":
        return "bg-green-500"
      case "yellow":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  // Determine card size
  const getCardSize = () => {
    switch (size) {
      case "sm":
        return "w-16 h-24"
      case "lg":
        return "w-32 h-48"
      case "md":
      default:
        return "w-24 h-36"
    }
  }

  // Determine font size
  const getFontSize = () => {
    switch (size) {
      case "sm":
        return "text-xl"
      case "lg":
        return "text-4xl"
      case "md":
      default:
        return "text-2xl"
    }
  }

  // Render card content based on type
  const renderCardContent = () => {
    if (card.value !== undefined) {
      // Number card
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <span className={`font-bold ${getFontSize()}`}>{card.value}</span>
        </div>
      )
    }

    // Special card
    switch (card.type) {
      case "skip":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className={`font-bold ${getFontSize()} relative`}>
              <div className="absolute inset-0 border-2 border-white dark:border-black rounded-full transform rotate-45"></div>
              <span>⊘</span>
            </div>
          </div>
        )
      case "reverse":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <span className={`font-bold ${getFontSize()}`}>↺</span>
          </div>
        )
      case "draw-two":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <span className={`font-bold ${getFontSize()}`}>+2</span>
          </div>
        )
      case "wild":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="grid grid-cols-2 gap-1">
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
              <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            </div>
          </div>
        )
      case "wild-draw-four":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <span className={`font-bold ${getFontSize()} mb-1`}>+4</span>
            <div className="grid grid-cols-2 gap-1">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <motion.div
      className={`${getCardSize()} rounded-xl ${getCardColor()} border-4 border-white dark:border-slate-700 shadow-lg flex items-center justify-center cursor-pointer overflow-hidden`}
      onClick={onClick}
      whileHover={{ scale: isActive ? 1.05 : 1 }}
      whileTap={{ scale: isActive ? 0.95 : 1 }}
    >
      <div className="absolute inset-2 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center">
        {renderCardContent()}
      </div>

      {/* Card corners */}
      <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
        {card.value !== undefined ? (
          <span className="text-xs font-bold">{card.value}</span>
        ) : (
          <span className="text-xs font-bold">
            {card.type === "skip"
              ? "⊘"
              : card.type === "reverse"
                ? "↺"
                : card.type === "draw-two"
                  ? "+2"
                  : card.type === "wild"
                    ? "W"
                    : card.type === "wild-draw-four"
                      ? "+4"
                      : ""}
          </span>
        )}
      </div>

      <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
        {card.value !== undefined ? (
          <span className="text-xs font-bold">{card.value}</span>
        ) : (
          <span className="text-xs font-bold">
            {card.type === "skip"
              ? "⊘"
              : card.type === "reverse"
                ? "↺"
                : card.type === "draw-two"
                  ? "+2"
                  : card.type === "wild"
                    ? "W"
                    : card.type === "wild-draw-four"
                      ? "+4"
                      : ""}
          </span>
        )}
      </div>

      {/* Card design elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 rounded-full border-2 border-white/20 dark:border-black/20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-full border-2 border-white/20 dark:border-black/20"></div>
      </div>
    </motion.div>
  )
}
