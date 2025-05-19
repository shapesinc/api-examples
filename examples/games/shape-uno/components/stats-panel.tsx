"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BarChart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { loadStats, type GameStats } from "@/lib/stats"

interface StatsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function StatsPanel({ isOpen, onClose }: StatsPanelProps) {
  const [stats, setStats] = useState<GameStats | null>(null)

  useEffect(() => {
    if (isOpen) {
      setStats(loadStats())
    }
  }, [isOpen])

  if (!stats) return null

  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="p-6 bg-white dark:bg-slate-800 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <BarChart className="w-5 h-5 mr-2 text-purple-500" />
                  <h2 className="text-xl font-bold">Game Statistics</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <p className="text-sm text-purple-600 dark:text-purple-300">Games Played</p>
                  <p className="text-2xl font-bold">{stats.gamesPlayed}</p>
                </div>

                <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <p className="text-sm text-cyan-600 dark:text-cyan-300">Win Rate</p>
                  <p className="text-2xl font-bold">{winRate}%</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Games Won</span>
                  <span className="font-medium">{stats.gamesWon}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm">Games Lost</span>
                  <span className="font-medium">{stats.gamesLost}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm">Current Win Streak</span>
                  <span className="font-medium">{stats.currentWinStreak}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm">Best Win Streak</span>
                  <span className="font-medium">{stats.winStreak}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm">Cards Played</span>
                  <span className="font-medium">{stats.cardsPlayed}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm">Cards Drawn</span>
                  <span className="font-medium">{stats.cardsDrawn}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm">Special Cards Played</span>
                  <span className="font-medium">{stats.specialCardsPlayed}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm">Wild Cards Played</span>
                  <span className="font-medium">{stats.wildCardsPlayed}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm">Highest Card Count</span>
                  <span className="font-medium">{stats.highestCardCount}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm">Fastest Win</span>
                  <span className="font-medium">
                    {stats.fastestWin ? `${Math.floor(stats.fastestWin / 60)}m ${stats.fastestWin % 60}s` : "N/A"}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
