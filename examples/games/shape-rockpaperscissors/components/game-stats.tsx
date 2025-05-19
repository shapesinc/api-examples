"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { motion } from "framer-motion"

type GameStats = {
  user: number
  ai: number
  draws: number
  moveStats: {
    rock: number
    paper: number
    scissors: number
    lizard: number
    spock: number
  }
  aiMoveStats: {
    rock: number
    paper: number
    scissors: number
    lizard: number
    spock: number
  }
  gameHistory: {
    userMove: string
    aiMove: string
    result: string
    timestamp: number
  }[]
}

type GameStatsProps = {
  stats: GameStats
  onClose: () => void
}

export function GameStats({ stats, onClose }: GameStatsProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Prepare data for charts
  const resultData = [
    { name: "Wins", value: stats.user, color: "#10B981" },
    { name: "Losses", value: stats.ai, color: "#EF4444" },
    { name: "Draws", value: stats.draws, color: "#F59E0B" },
  ]

  const moveData = [
    { name: "Rock", user: stats.moveStats.rock, ai: stats.aiMoveStats.rock },
    { name: "Paper", user: stats.moveStats.paper, ai: stats.aiMoveStats.paper },
    { name: "Scissors", user: stats.moveStats.scissors, ai: stats.aiMoveStats.scissors },
  ]

  // Calculate win rate
  const totalGames = stats.user + stats.ai + stats.draws
  const winRate = totalGames > 0 ? Math.round((stats.user / totalGames) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Game Statistics</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="moves">Moves</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Win Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-4xl font-bold text-primary">{winRate}%</div>
                    <p className="text-sm text-muted-foreground">{totalGames} total games played</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Best Move</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold capitalize">
                      {
                        Object.entries(stats.moveStats).reduce(
                          (best, [move, count]) => (count > best.count ? { move, count } : best),
                          { move: "none", count: 0 },
                        ).move
                      }
                    </div>
                    <p className="text-sm text-muted-foreground">Your most played move</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">AI Preference</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold capitalize">
                      {
                        Object.entries(stats.aiMoveStats).reduce(
                          (best, [move, count]) => (count > best.count ? { move, count } : best),
                          { move: "none", count: 0 },
                        ).move
                      }
                    </div>
                    <p className="text-sm text-muted-foreground">AI's most played move</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Results Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 h-64">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={resultData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {resultData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moves" className="space-y-6">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Move Usage Comparison</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moveData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="user" name="You" fill="#9F7AEA" />
                      <Bar dataKey="ai" name="AI" fill="#F472B6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Your Move Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ul className="space-y-4 sm:space-y-2">
                      {Object.entries(stats.moveStats).map(([move, count]) => (
                        <li key={move} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <span className="capitalize font-medium">{move}</span>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="w-full sm:w-32 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{
                                  width: `${totalGames > 0 ? (count / totalGames) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {totalGames > 0 ? Math.round((count / totalGames) * 100) : 0}%
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">AI Move Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ul className="space-y-2">
                      {Object.entries(stats.aiMoveStats).map(([move, count]) => (
                        <li key={move} className="flex justify-between items-center">
                          <span className="capitalize">{move}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{
                                  width: `${totalGames > 0 ? (count / totalGames) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {totalGames > 0 ? Math.round((count / totalGames) * 100) : 0}%
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Game History</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {stats.gameHistory.length > 0 ? (
                    <div className="max-h-96 overflow-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Time</th>
                            <th className="text-left p-2">Your Move</th>
                            <th className="text-left p-2">AI Move</th>
                            <th className="text-left p-2">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.gameHistory
                            .slice()
                            .reverse()
                            .map((game, index) => (
                              <tr key={index} className="border-b">
                                <td className="p-2 text-sm">{new Date(game.timestamp).toLocaleTimeString()}</td>
                                <td className="p-2 capitalize">{game.userMove}</td>
                                <td className="p-2 capitalize">{game.aiMove}</td>
                                <td className="p-2">
                                  <span
                                    className={
                                      game.result === "win"
                                        ? "text-green-500"
                                        : game.result === "lose"
                                          ? "text-red-500"
                                          : "text-yellow-500"
                                    }
                                  >
                                    {game.result === "win" ? "Win" : game.result === "lose" ? "Loss" : "Draw"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No game history yet</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
