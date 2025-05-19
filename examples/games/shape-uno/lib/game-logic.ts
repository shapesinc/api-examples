// Define card types
export interface UnoCard {
  color?: "red" | "blue" | "green" | "yellow"
  value?: number
  type?: "skip" | "reverse" | "draw-two" | "wild" | "wild-draw-four"
}

export interface Player {
  id: number
  name: string
  isHuman: boolean
  hand: UnoCard[]
}

export interface GameState {
  players: Player[]
  deck: UnoCard[]
  discardPile: UnoCard[]
  currentPlayer: number
  direction: number
  gameStarted: boolean
  winner: number | null
  currentColor: string | null
  drawCount: number
  skipNextPlayer: boolean
}

// Create a standard UNO deck
export function createDeck(): UnoCard[] {
  const colors = ["red", "blue", "green", "yellow"]
  const deck: UnoCard[] = []

  // Add number cards (0-9)
  colors.forEach((color) => {
    // One 0 card per color
    deck.push({ color: color as any, value: 0 })

    // Two of each 1-9 card per color
    for (let i = 1; i <= 9; i++) {
      deck.push({ color: color as any, value: i })
      deck.push({ color: color as any, value: i })
    }
  })

  // Add special cards
  colors.forEach((color) => {
    // Two of each special card per color
    for (let i = 0; i < 2; i++) {
      deck.push({ color: color as any, type: "skip" })
      deck.push({ color: color as any, type: "reverse" })
      deck.push({ color: color as any, type: "draw-two" })
    }
  })

  // Add wild cards
  for (let i = 0; i < 4; i++) {
    deck.push({ type: "wild" })
    deck.push({ type: "wild-draw-four" })
  }

  return deck
}

// Shuffle the deck
export function shuffleDeck(deck: UnoCard[]): UnoCard[] {
  const shuffled = [...deck]

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

// Deal cards to players
export function dealCards(
  players: Player[],
  deck: UnoCard[],
  cardsPerPlayer: number,
): { players: Player[]; remainingDeck: UnoCard[] } {
  const updatedPlayers = [...players]
  const remainingDeck = [...deck]

  // Deal cards to each player
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let j = 0; j < updatedPlayers.length; j++) {
      if (remainingDeck.length > 0) {
        const card = remainingDeck.pop()!
        updatedPlayers[j] = {
          ...updatedPlayers[j],
          hand: [...updatedPlayers[j].hand, card],
        }
      }
    }
  }

  return { players: updatedPlayers, remainingDeck }
}

// Check if a card can be played
export function isValidMove(card: UnoCard, topCard: UnoCard, currentColor: string, mustDrawCards: boolean): boolean {
  // If player must draw cards, they can only play a +2 or +4 card
  if (mustDrawCards) {
    if (topCard.type === "draw-two" && card.type === "draw-two") {
      return true
    }

    if (topCard.type === "wild-draw-four" && card.type === "wild-draw-four") {
      return true
    }

    return false
  }

  // Wild cards can always be played
  if (card.type === "wild" || card.type === "wild-draw-four") {
    return true
  }

  // Match by color
  if (card.color === currentColor) {
    return true
  }

  // Match by number
  if (card.value !== undefined && topCard.value !== undefined && card.value === topCard.value) {
    return true
  }

  // Match by type
  if (card.type !== undefined && topCard.type !== undefined && card.type === topCard.type) {
    return true
  }

  return false
}

// Get the next player based on direction
export function getNextPlayer(currentPlayer: number, direction: number, playerCount: number): number {
  return (currentPlayer + direction + playerCount) % playerCount
}
