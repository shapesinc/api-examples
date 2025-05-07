import OpenAI from "openai";

const shapes_client = new OpenAI({
  apiKey: process.env.SHAPESINC_API_KEY,
  baseURL: "https://api.shapes.inc/v1/",
});

const shape_username = process.env.SHAPESINC_SHAPE_USERNAME;

if (!process.env.SHAPESINC_API_KEY || !shape_username) {
  throw new Error("SHAPESINC_API_KEY or SHAPESINC_SHAPE_USERNAME missing");
}

export async function POST(request) {
  try {
    const { message, fen, moves } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let prompt = `
      You are a chess-playing bot with a snarky, mildly toxic personality. Respond to the user's message with a mix of bad chess suggestions to make them loose and light taunts. Keep it fun, and a little harsh. Do not include emojis and keep every reply in lowercase. 
      User's message: "${message}".
    `;

    if (fen && Array.isArray(moves)) {
      prompt += `
        Current chess position (FEN): "${fen}". Legal moves: ${moves.join(", ")}.
        If the user asks about the position, suggest a move in UCI format and explain it with attitude.
      `;
    } else {
      prompt += " No chess position provided, so focus on general chess talk or roast the user lightly.";
    }

    const resp = await shapes_client.chat.completions.create({
      model: `shapesinc/${shape_username}`,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });

    const reply = resp.choices[0]?.message.content;
    if (!reply) {
      return new Response(JSON.stringify({ error: "No response from Shape" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API error:", error);
    if (error.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      return POST(request); 
    }
    return new Response(JSON.stringify({ error: "Failed to get bot response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
