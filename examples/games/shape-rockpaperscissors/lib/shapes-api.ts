import { OpenAI } from "openai"

const shapesClient = new OpenAI({
  apiKey: process.env.SHAPES_API_KEY || "",
  baseURL: "https://api.shapes.inc/v1",
})

export async function getAIMove(userMove: string, userId: string, channelId: string) {
  try {
    const response = await shapesClient.chat.completions.create({
      model: `shapesinc/${process.env.SHAPES_USERNAME || ""}`,
      messages: [
        {
          role: "user",
          content: `I'm playing Rock Paper Scissors with you and I chose ${userMove}. Please respond with only one word: "rock", "paper", or "scissors" as your move.`,
        },
      ],
      headers: {
        "X-User-Id": userId,
        "X-Channel-Id": channelId,
      },
    })

    
    const aiMove = response.choices[0].message.content?.toLowerCase().trim()

    if (aiMove === "rock" || aiMove === "paper" || aiMove === "scissors") {
      return aiMove
    } else {
      const moves = ["rock", "paper", "scissors"]
      return moves[Math.floor(Math.random() * moves.length)]
    }
  } catch (error) {
    console.error("Error getting AI move:", error)
    const moves = ["rock", "paper", "scissors"]
    return moves[Math.floor(Math.random() * moves.length)]
  }
}

export async function getAIComment(
  result: string,
  userMove: string,
  aiMove: string,
  userId: string,
  channelId: string,
) {
  try {
    const response = await shapesClient.chat.completions.create({
      model: `shapesinc/${process.env.SHAPES_USERNAME || ""}`,
      messages: [
        {
          role: "user",
          content: `We just played Rock Paper Scissors. I chose ${userMove}, you chose ${aiMove}, and the result was: ${result}. Give me a short, witty one-liner comment about our game (max 100 characters).`,
        },
      ],
      headers: {
        "X-User-Id": userId,
        "X-Channel-Id": channelId,
      },
    })

    return response.choices[0].message.content || "Good game!"
  } catch (error) {
    console.error("Error getting AI comment:", error)
    return "Good game!"
  }
}
