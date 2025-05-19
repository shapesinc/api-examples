export async function getAIMove(gameState: string): Promise<{ cardIndex: string; chosenColor?: string }> {
  try {
    const response = await fetch("/api/ai-move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameState }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting AI move:", error)
    return {
      cardIndex: "0",
      chosenColor: "red",
    }
  }
}
