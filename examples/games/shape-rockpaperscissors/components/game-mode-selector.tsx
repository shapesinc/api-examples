"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Zap, Brain, Gauge } from "lucide-react"

export type GameMode = "classic" | "advanced" | "psychic" | "blitz"

type GameModeSelectorProps = {
  onSelect: (mode: GameMode) => void
  onClose: () => void
}

export function GameModeSelector({ onSelect, onClose }: GameModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null)

  const gameModes = [
    {
      id: "classic",
      name: "Classic",
      description: "The traditional Rock Paper Scissors game you know and love.",
      icon: <Sparkles className="h-5 w-5" />,
      color: "from-blue-500 to-purple-500",
    },
    {
      id: "advanced",
      name: "Advanced",
      description: "Rock Paper Scissors Lizard Spock - more choices, more fun!",
      icon: <Zap className="h-5 w-5" />,
      color: "from-green-500 to-teal-500",
    },
    {
      id: "psychic",
      name: "Psychic Mode",
      description: "Can you outsmart the AI that learns your patterns?",
      icon: <Brain className="h-5 w-5" />,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "blitz",
      name: "Blitz",
      description: "Fast-paced mode with a time limit. Think quickly!",
      icon: <Gauge className="h-5 w-5" />,
      color: "from-red-500 to-orange-500",
    },
  ]

  const handleSelect = () => {
    if (selectedMode) {
      onSelect(selectedMode)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Game Mode</CardTitle>
        <CardDescription>Choose how you want to play against the AI</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {gameModes.map((mode) => (
            <Card
              key={mode.id}
              className={`cursor-pointer transition-all ${
                selectedMode === mode.id ? "ring-2 ring-primary" : "hover:bg-accent"
              }`}
              onClick={() => setSelectedMode(mode.id as GameMode)}
            >
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className={`p-1.5 rounded-full bg-gradient-to-r ${mode.color} text-white`}>{mode.icon}</div>
                  {mode.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">{mode.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button onClick={handleSelect} disabled={!selectedMode} className="w-full sm:w-auto">
          Start Game
        </Button>
      </CardFooter>
    </Card>
  )
}
