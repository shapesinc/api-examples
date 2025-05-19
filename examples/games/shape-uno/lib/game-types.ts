export type PlayerColor = "red" | "green" | "yellow" | "blue"

export interface Pawn {
  id: number
  position: number // -1 for home, 0-51 for main track, 52-57 for home run
  isHome: boolean
  isFinished: boolean
}

export interface Player {
  id: number
  color: PlayerColor
  isHuman: boolean
  pawns: Pawn[]
  score: number
  startPosition: number
}

export interface MoveRecord {
  player: number
  pawn: number
  diceValue: number
  timestamp: string
}

export interface GameState {
  players: Player[]
  currentPlayer: number
  diceValue: number
  isRolling: boolean
  gameStarted: boolean
  winner: number | null
  moveHistory: MoveRecord[]
}

// Board layout constants
export const BOARD_SIZE = 52 // Main track size
export const HOME_RUN_SIZE = 6 // Home run track size
export const PLAYER_START_POSITIONS = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
}

// Helper functions
export function isValidMove(pawn: Pawn, diceValue: number): boolean {
  // Can't move finished pawns
  if (pawn.isFinished) return false

  // Need a 6 to move out of home
  if (pawn.isHome && diceValue !== 6) return false

  // Check if pawn would overshoot home run
  if (!pawn.isHome && !pawn.isFinished && pawn.position >= 52) {
    return pawn.position + diceValue <= 57
  }

  return true
}
