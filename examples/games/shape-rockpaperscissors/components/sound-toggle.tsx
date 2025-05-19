"use client"

import { useState, useEffect } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useSound } from "@/lib/sound-manager"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function SoundToggle() {
  const soundManager = useSound()
  const [muted, setMuted] = useState(true)
  const [volume, setVolume] = useState(0.5)

  useEffect(() => {
    if (soundManager) {
      setMuted(soundManager.isMuted())
      setVolume(soundManager.getVolume())
    }
  }, [soundManager])

  const handleToggleMute = () => {
    if (soundManager) {
      const newMuted = soundManager.toggleMute()
      setMuted(newMuted)

      if (!newMuted) {
        soundManager.playSound("click")
      }
    }
  }

  const handleVolumeChange = (value: number[]) => {
    if (soundManager) {
      const newVolume = soundManager.setVolume(value[0])
      setVolume(newVolume)

      if (!muted) {
        soundManager.playSound("click")
      }
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          {muted ? <VolumeX className="h-[1.2rem] w-[1.2rem]" /> : <Volume2 className="h-[1.2rem] w-[1.2rem]" />}
          <span className="sr-only">Toggle sound</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60" align="end">
        <div className="flex flex-col gap-4 p-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sound</span>
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleToggleMute}>
              {muted ? "Unmute" : "Mute"}
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <VolumeX className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              disabled={muted}
              className="flex-1"
            />
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
