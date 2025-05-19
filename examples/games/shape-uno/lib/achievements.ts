export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  timestamp?: number
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_win",
    title: "First Victory",
    description: "Win your first game of UNO",
    icon: "🏆",
    unlocked: false,
  },
  {
    id: "win_streak_3",
    title: "Hat Trick",
    description: "Win 3 games in a row",
    icon: "🎩",
    unlocked: false,
  },
  {
    id: "play_wild",
    title: "Wild Thing",
    description: "Play 5 wild cards in a single game",
    icon: "🌈",
    unlocked: false,
  },
  {
    id: "uno_call",
    title: "Last Card Standing",
    description: "Successfully call UNO",
    icon: "🔊",
    unlocked: false,
  },
  {
    id: "comeback_kid",
    title: "Comeback Kid",
    description: "Win a game after having 10+ cards in your hand",
    icon: "🔄",
    unlocked: false,
  },
  {
    id: "card_collector",
    title: "Card Collector",
    description: "Draw 15 cards in a single game",
    icon: "🃏",
    unlocked: false,
  },
  {
    id: "quick_win",
    title: "Speed Demon",
    description: "Win a game in under 2 minutes",
    icon: "⚡",
    unlocked: false,
  },
  {
    id: "night_owl",
    title: "Night Owl",
    description: "Play a game between midnight and 5 AM",
    icon: "🦉",
    unlocked: false,
  },
]

// Load achievements from local storage
export function loadAchievements(): Achievement[] {
  if (typeof window === "undefined") return ACHIEVEMENTS

  const savedAchievements = localStorage.getItem("uno_achievements")
  if (!savedAchievements) return ACHIEVEMENTS

  try {
    return JSON.parse(savedAchievements)
  } catch (e) {
    return ACHIEVEMENTS
  }
}

// Save achievements to local storage
export function saveAchievements(achievements: Achievement[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem("uno_achievements", JSON.stringify(achievements))
}

// Unlock an achievement
export function unlockAchievement(id: string, achievements: Achievement[]): Achievement[] {
  const updatedAchievements = achievements.map((achievement) => {
    if (achievement.id === id && !achievement.unlocked) {
      return {
        ...achievement,
        unlocked: true,
        timestamp: Date.now(),
      }
    }
    return achievement
  })

  saveAchievements(updatedAchievements)
  return updatedAchievements
}

// Check if an achievement is unlocked
export function isAchievementUnlocked(id: string, achievements: Achievement[]): boolean {
  const achievement = achievements.find((a) => a.id === id)
  return achievement?.unlocked || false
}

// Get all unlocked achievements
export function getUnlockedAchievements(achievements: Achievement[]): Achievement[] {
  return achievements.filter((a) => a.unlocked)
}

// Get all locked achievements
export function getLockedAchievements(achievements: Achievement[]): Achievement[] {
  return achievements.filter((a) => !a.unlocked)
}
