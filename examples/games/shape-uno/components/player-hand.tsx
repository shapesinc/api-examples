"use client"

import { motion } from "framer-motion"
import UnoCard from "@/components/uno-card"
import type { UnoCard as UnoCardType } from "@/lib/game-logic"

interface PlayerHandProps {
  cards: UnoCardType[]
  onCardSelect: (index: number) => void
  isActive: boolean
}

export default function PlayerHand({ cards, onCardSelect, isActive }: PlayerHandProps) {
  // Calculate the fan angle based on the number of cards
  const getFanAngle = () => {
    const maxAngle = 30 // Maximum angle in degrees
    const cardCount = cards.length

    if (cardCount <= 1) return 0

    // Limit the angle for many cards
    return Math.min(maxAngle, cardCount * 2)
  }

  // Calculate the position and rotation for each card
  const getCardStyle = (index: number) => {
    const totalCards = cards.length
    if (totalCards <= 1) return { rotate: 0, translateY: 0 }

    const fanAngle = getFanAngle()
    const startAngle = -fanAngle / 2
    const angleIncrement = fanAngle / (totalCards - 1)
    const cardAngle = startAngle + index * angleIncrement

    // Calculate vertical offset based on angle
    const translateY = Math.abs(cardAngle) * 0.5

    return {
      rotate: cardAngle,
      translateY: translateY,
    }
  }

  return (
    <div className="relative h-48 flex items-center justify-center">
      {cards.map((card, index) => {
        const { rotate, translateY } = getCardStyle(index)

        return (
          <motion.div
            key={`${card.color}-${card.value || card.type}-${index}`}
            className="absolute origin-bottom"
            style={{
              zIndex: index,
              left: `calc(50% - ${cards.length > 1 ? 12 : 0}px)`,
            }}
            initial={{ rotate, translateY, opacity: 0, scale: 0.8 }}
            animate={{
              rotate,
              translateY,
              opacity: 1,
              scale: 1,
              x: `${(index - (cards.length - 1) / 2) * 30}px`,
            }}
            transition={{ duration: 0.3 }}
          >
            <UnoCard card={card} onClick={() => isActive && onCardSelect(index)} isActive={isActive} />
          </motion.div>
        )
      })}
    </div>
  )
}
