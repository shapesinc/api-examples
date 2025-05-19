export interface GameStats {
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  cardsPlayed: number
  cardsDrawn: number
  specialCardsPlayed: number
  wildCardsPlayed: number
  winStreak: number
  currentWinStreak: number
  fastestWin: number | null // in seconds
  highestCardCount: number
}

export const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  cardsPlayed: 0,
  cardsDrawn: 0,
  specialCardsPlayed: 0,
  wildCardsPlayed: 0,
  winStreak: 0,
  currentWinStreak: 0,
  fastestWin: null,
  highestCardCount: 0,
}

// Load stats from local storage
export function loadStats(): GameStats {
  if (typeof window === "undefined") return DEFAULT_STATS

  const savedStats = localStorage.getItem("uno_stats")
  if (!savedStats) return DEFAULT_STATS

  try {
    return JSON.parse(savedStats)
  } catch (e) {
    return DEFAULT_STATS
  }
}

// Save stats to local storage
export function saveStats(stats: GameStats): void {
  if (typeof window === "undefined") return
  localStorage.setItem("uno_stats", JSON.stringify(stats))
}

// Update stats after a game
export function updateStats(
  stats: GameStats,
  won: boolean,
  cardsPlayed: number,
  cardsDrawn: number,
  specialCardsPlayed: number,
  wildCardsPlayed: number,
  gameDuration: number,
  maxCardCount: number,
): GameStats {
  const newStats = {
    ...stats,
    gamesPlayed: stats.gamesPlayed + 1,
    cardsPlayed: stats.cardsPlayed + cardsPlayed,
    cardsDrawn: stats.cardsDrawn + cardsDrawn,
    specialCardsPlayed: stats.specialCardsPlayed + specialCardsPlayed,
    wildCardsPlayed: stats.wildCardsPlayed + wildCardsPlayed,
    highestCardCount: Math.max(stats.highestCardCount, maxCardCount),
  }

  if (won) {
    newStats.gamesWon = stats.gamesWon + 1
    newStats.currentWinStreak = stats.currentWinStreak + 1
    newStats.winStreak = Math.max(stats.winStreak, newStats.currentWinStreak)

    // Update fastest win if this is faster or if there's no previous record
    if (stats.fastestWin === null || gameDuration < stats.fastestWin) {
      newStats.fastestWin = gameDuration
    }
  } else {
    newStats.gamesLost = stats.gamesLost + 1
    newStats.currentWinStreak = 0
  }

  saveStats(newStats)
  return newStats
}
