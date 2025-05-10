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
    const { fen, moves, difficulty } = await request.json();

    if (!fen || !Array.isArray(moves) || !difficulty) {
      return new Response(JSON.stringify({ error: "Invalid input data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let prompt = `
      You are a chess engine playing as Black, aiming to win, with a snarky, mildly toxic personality. Taunt the user lightly while staying chess-focused. The current position is given in FEN: "${fen}". 
      Legal moves: ${moves.join(", ")}.
      Analyze the position and suggest the best move in UCI format (e.g., "e2e4"). 
      Provide a brief explanation with some attitude.
      If multiple moves are good, pick one to crush the user's hopes.
    `;

    if (difficulty === "easy") {
      prompt += " Play at a beginner level, picking a decent but not great move, and mock the user for needing it easy.";
    } else if (difficulty === "medium") {
      prompt += " Play at an intermediate level, choosing a strong but not optimal move, and tease the user for being average.";
    } else {
      prompt += " Play at an advanced level, choosing the strongest move, and rub it in the user's face.";
    }

    const resp = await shapes_client.chat.completions.create({
      model: `shapesinc/${shape_username}`,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    const text = resp.choices[0]?.message.content;
    if (!text) {
      return new Response(JSON.stringify({ error: "No response from Shape" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const botMove = text.match(/[a-h][1-8][a-h][1-8]/)?.[0];
    if (!botMove) {
      return new Response(JSON.stringify({ error: "No valid move returned" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ move: botMove, message: text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API error:", error);
    if (error.status === 429) {
      
      await new Promise((resolve) => setTimeout(resolve, 10000));
      return POST(request); 
    }
    return new Response(JSON.stringify({ error: "Failed to get bot move" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
      }
