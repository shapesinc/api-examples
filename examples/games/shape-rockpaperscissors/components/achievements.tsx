"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Trophy, Award, Star, Zap, Target, Crown } from "lucide-react"

export type Achievement = {
  id: string
  name: string
  description: string
  icon: "trophy" | "award" | "star" | "zap" | "target" | "crown"
  unlocked: boolean
  progress?: number
  maxProgress?: number
  secret?: boolean
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
  unlockedAt?: number
}

type AchievementsProps = {
  achievements: Achievement[]
  onClose: () => void
  newUnlocked?: string[]
}

export function Achievements({ achievements, onClose, newUnlocked = [] }: AchievementsProps) {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all")

  const filteredAchievements = achievements.filter((achievement) => {
    if (filter === "all") return true
    if (filter === "unlocked") return achievement.unlocked
    if (filter === "locked") return !achievement.unlocked
    return true
  })

  const getIcon = (icon: Achievement["icon"], className = "h-6 w-6") => {
    switch (icon) {
      case "trophy":
        return <Trophy className={className} />
      case "award":
        return <Award className={className} />
      case "star":
        return <Star className={className} />
      case "zap":
        return <Zap className={className} />
      case "target":
        return <Target className={className} />
      case "crown":
        return <Crown className={className} />
    }
  }

  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500"
      case "uncommon":
        return "bg-green-500"
      case "rare":
        return "bg-blue-500"
      case "epic":
        return "bg-purple-500"
      case "legendary":
        return "bg-yellow-500"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Achievements
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className="rounded-r-none"
              >
                All
              </Button>
              <Button
                variant={filter === "unlocked" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("unlocked")}
                className="rounded-none border-x-0"
              >
                Unlocked
              </Button>
              <Button
                variant={filter === "locked" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("locked")}
                className="rounded-l-none"
              >
                Locked
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto">
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredAchievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={newUnlocked.includes(achievement.id) ? { scale: 0.9, opacity: 0 } : {}}
                animate={newUnlocked.includes(achievement.id) ? { scale: 1, opacity: 1 } : {}}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`relative rounded-lg border p-4 ${achievement.unlocked ? "bg-card" : "bg-muted/50"}`}
              >
                {newUnlocked.includes(achievement.id) && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-primary">New!</Badge>
                  </div>
                )}
                <div className="flex gap-4">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full ${
                      achievement.unlocked
                        ? `${getRarityColor(achievement.rarity)} text-white`
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {getIcon(achievement.icon)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        {achievement.secret && !achievement.unlocked ? "???" : achievement.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`capitalize ${achievement.unlocked ? getRarityColor(achievement.rarity) : ""}`}
                      >
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {achievement.secret && !achievement.unlocked ? "Secret achievement" : achievement.description}
                    </p>

                    {achievement.progress !== undefined && achievement.maxProgress && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>
                            {achievement.progress}/{achievement.maxProgress}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full ${achievement.unlocked ? "bg-primary" : "bg-muted-foreground"}`}
                            style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {achievement.unlocked && achievement.unlockedAt && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
