class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private musicElement: HTMLAudioElement | null = null
  private muted = false
  private volume = 0.5

  constructor() {
    if (typeof window !== "undefined") {
      this.loadSounds()
    }
  }

  private loadSounds() {
    this.preloadSound("rock", "/sounds/rock.mp3")
    this.preloadSound("paper", "/sounds/paper.mp3")
    this.preloadSound("scissors", "/sounds/scissors.mp3")
    this.preloadSound("lizard", "/sounds/lizard.mp3")
    this.preloadSound("spock", "/sounds/spock.mp3")
    this.preloadSound("win", "/sounds/win.mp3")
    this.preloadSound("lose", "/sounds/lose.mp3")
    this.preloadSound("draw", "/sounds/draw.mp3")
    this.preloadSound("click", "/sounds/click.mp3")
    this.preloadSound("hover", "/sounds/hover.mp3")

    
    this.musicElement = new Audio("/sounds/background.mp3")
    if (this.musicElement) {
      this.musicElement.loop = true
      this.musicElement.volume = this.volume * 0.3 // Music a bit quieter than effects
    }
  }

  private preloadSound(name: string, url: string) {
    const audio = new Audio()
    audio.src = url
    audio.preload = "auto"
    this.sounds.set(name, audio)
  }

  public playSound(name: string) {
    if (this.muted) return

    const sound = this.sounds.get(name)
    if (sound) {
      const soundClone = sound.cloneNode() as HTMLAudioElement
      soundClone.volume = this.volume
      soundClone.play().catch((e) => console.error("Error playing sound:", e))
    }
  }

  public playMusic() {
    if (this.muted || !this.musicElement) return

    this.musicElement.play().catch((e) => console.error("Error playing music:", e))
  }

  public pauseMusic() {
    if (!this.musicElement) return

    this.musicElement.pause()
  }

  public toggleMute() {
    this.muted = !this.muted

    if (this.muted) {
      this.pauseMusic()
    } else {
      this.playMusic()
    }

    return this.muted
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))

    if (this.musicElement) {
      this.musicElement.volume = this.volume * 0.3
    }

    return this.volume
  }

  public isMuted() {
    return this.muted
  }

  public getVolume() {
    return this.volume
  }
}

export const soundManager = typeof window !== "undefined" ? new SoundManager() : null

export function useSound() {
  return soundManager
  }
