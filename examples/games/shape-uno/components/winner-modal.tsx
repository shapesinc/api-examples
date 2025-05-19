"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import confetti from "canvas-confetti"
import { useEffect } from "react"

interface WinnerModalProps {
  isOpen: boolean
  winner: string
  onClose: () => void
  onNewGame: () => void
}

export default function WinnerModal({ isOpen, winner, onClose, onNewGame }: WinnerModalProps) {
  useEffect(() => {
    if (isOpen) {   
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
      }, 250)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-500 to-cyan-500 text-white shadow-xl">
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.8 }}
                >
                  <Trophy className="w-16 h-16 text-yellow-300 mb-2" />
                </motion.div>

                <motion.h2
                  className="text-3xl font-bold mb-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {winner} Wins!
                </motion.h2>

                <motion.p
                  className="mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Congratulations on your victory!
                </motion.p>

                <div className="flex gap-4">
                  <Button onClick={onNewGame} className="bg-white text-purple-500 hover:bg-slate-100">
                    New Game
                  </Button>
                  <Button variant="outline" onClick={onClose} className="border-white text-white hover:bg-white/20">
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
