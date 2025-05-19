"use server"

import { getAIMove, getAIComment } from "@/lib/shapes-api"
import { v4 as uuidv4 } from "uuid"

let sessionId: string

type Move = "rock" | "paper" | "scissors" | "lizard" | "spock"
type GameMode = "classic" | "advanced" | "psychic" | "blitz"

const userMoveHistory: Record<string, Move[]> = {}

export async function playGame(userMove: string, gameMode = "classic") {
  const userId = uuidv4()
  const channelId = uuidv4()
  let aiMove: Move

  if (gameMode === "psychic" && userId in userMoveHistory) {
    const history = userMoveHistory[userId]
    if (history.length >= 3) {
      const lastThreeMoves = history.slice(-3)
      if (lastThreeMoves[0] === lastThreeMoves[1] && lastThreeMoves[1] === lastThreeMoves[2]) {
        aiMove = getCounterMove(lastThreeMoves[0])
      } else {
        aiMove = getCounterMove(lastThreeMoves[2])
      }
    } else {      
      aiMove = (await getAIMove(userMove, userId, channelId)) as Move
    }

    userMoveHistory[userId].push(userMove as Move)
  } else {
    aiMove = (await getAIMove(userMove, userId, channelId)) as Move

    if (gameMode === "psychic") {
      userMoveHistory[userId] = [userMove as Move]
    }
  }

  let result: "win" | "lose" | "draw"

  if (gameMode === "advanced") {    
    if (userMove === aiMove) {
      result = "draw"
    } else if (
      (userMove === "rock" && (aiMove === "scissors" || aiMove === "lizard")) ||
      (userMove === "paper" && (aiMove === "rock" || aiMove === "spock")) ||
      (userMove === "scissors" && (aiMove === "paper" || aiMove === "lizard")) ||
      (userMove === "lizard" && (aiMove === "paper" || aiMove === "spock")) ||
      (userMove === "spock" && (aiMove === "rock" || aiMove === "scissors"))
    ) {
      result = "win"
    } else {
      result = "lose"
    }
  } else {
    if (userMove === aiMove) {
      result = "draw"
    } else if (
      (userMove === "rock" && aiMove === "scissors") ||
      (userMove === "paper" && aiMove === "rock") ||
      (userMove === "scissors" && aiMove === "paper")
    ) {
      result = "win"
    } else {
      result = "lose"
    }
  }

  const comment = await getAIComment(result, userMove, aiMove, userId, channelId)

  return {
    userMove,
    aiMove,
    result,
    comment,
  }
}

function getCounterMove(move: Move): Move {
  switch (move) {
    case "rock":
      return "paper"
    case "paper":
      return "scissors"
    case "scissors":
      return "rock"
    case "lizard":
      return "rock"
    case "spock":
      return "lizard"
    default:
      return "rock"
  }
}
