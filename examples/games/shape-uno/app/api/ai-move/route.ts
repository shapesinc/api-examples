import { NextResponse } from "next/server"
import { OpenAI } from "openai"

const shapes_client = new OpenAI({
  apiKey: process.env.SHAPES_API_KEY || "",
  baseURL: "https://api.shapes.inc/v1",
  dangerouslyAllowBrowser: false,
})

export async function POST(request: Request) {
  try {
    const { gameState } = await request.json()

    if (!gameState) {
      return NextResponse.json({ error: "Game state is required" }, { status: 400 })
    }

    try {
      const response = await shapes_client.chat.completions.create({
        model: `shapesinc/${process.env.SHAPES_USERNAME || ""}`,
        messages: [
          {
            role: "user",
            content: `You are playing UNO. Based on the current game state, which card should I play? 
            ${gameState}
            
            Respond with a JSON object containing:
            1. cardIndex: The index of the card to play (0 for first card, 1 for second, etc.)
            2. chosenColor: If playing a wild card, which color to choose (red, blue, green, or yellow)
            
            Example response: { "cardIndex": "2", "chosenColor": "red" }`,
          },
        ],
      })

      const content = response.choices[0]?.message?.content || '{"cardIndex": "0", "chosenColor": "red"}'

      try {
        
        return NextResponse.json(JSON.parse(content))
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError)
        
        const cardIndexMatch = content.match(/"cardIndex":\s*"(\d+)"/)
        const colorMatch = content.match(/"chosenColor":\s*"(red|blue|green|yellow)"/)
        return NextResponse.json({
          cardIndex: cardIndexMatch ? cardIndexMatch[1] : "0",
          chosenColor: colorMatch ? colorMatch[1] : "red",
        })
      }
    } catch (error) {
      console.error("Error calling Shapes API:", error)
      return NextResponse.json(
        {
          cardIndex: "0",
          chosenColor: "red",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in AI move API:", error)
    return NextResponse.json({ error: "Failed to get AI move" }, { status: 500 })
  }
}
