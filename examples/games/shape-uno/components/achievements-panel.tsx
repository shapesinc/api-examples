"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { loadAchievements, getUnlockedAchievements, getLockedAchievements, type Achievement } from "@/lib/achievements"

interface AchievementsPanelProps {
  isOpen: boolean
  onClose: () => void
  newAchievement?: Achievement | null
}

export default function AchievementsPanel({ isOpen, onClose, newAchievement }: AchievementsPanelProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    setAchievements(loadAchievements())
  }, [])

  const unlockedAchievements = getUnlockedAchievements(achievements)
  const lockedAchievements = getLockedAchievements(achievements)

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
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  <h2 className="text-xl font-bold">Achievements</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {newAchievement && (
                <motion.div
                  className="mb-4 p-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg text-white"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{newAchievement.icon}</span>
                    <div>
                      <h3 className="font-bold">{newAchievement.title}</h3>
                      <p className="text-sm">{newAchievement.description}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="mb-4">
                <h3 className="font-medium text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Unlocked ({unlockedAchievements.length}/{achievements.length})
                </h3>

                {unlockedAchievements.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    No achievements unlocked yet. Keep playing!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {unlockedAchievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center"
                      >
                        <span className="text-2xl mr-3">{achievement.icon}</span>
                        <div>
                          <h4 className="font-medium">{achievement.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{achievement.description}</p>
                          {achievement.timestamp && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              Unlocked {new Date(achievement.timestamp).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Locked ({lockedAchievements.length})
                </h3>

                <div className="space-y-2">
                  {lockedAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center opacity-60"
                    >
                      <span className="text-2xl mr-3 grayscale">❔</span>
                      <div>
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                  Keep playing to unlock more achievements!
                </p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
