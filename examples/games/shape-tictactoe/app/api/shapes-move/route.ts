import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { board, difficulty, userMessage, moveHistory } = await req.json();

    if (!board || !Array.isArray(board) || board.length !== 9) {
      return NextResponse.json({ error: 'Invalid board state' }, { status: 400 });
    }

    if (!['normal', 'hard', 'extreme'].includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty level' }, { status: 400 });
    }

    const shapeUsername = process.env.SHAPE_USERNAME;
    const shapeApiKey = process.env.SHAPE_API_KEY;

    if (!shapeUsername || !shapeApiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const boardState = board.map(cell => (typeof cell === 'number' ? '_' : cell)).join('');
    const validMoves = board
      .map((cell, i) => (typeof cell === 'number' ? i : null))
      .filter(i => i !== null);

    let aiMove;
    let chatResponse = '';

    const moveHistoryText = moveHistory.length > 0
      ? `Move history: ${moveHistory.map(m => `${m.player} played ${m.index}`).join(', ')}. `
      : '';
    const prompt = `
      You are an expert Tic-Tac-Toe AI playing as O against X on a 3x3 grid, indexed 0 to 8.
      The current board is: ${boardState} (_ is empty, X is opponent, O is your mark).
      Valid moves: [${validMoves.join(', ')}].
      ${moveHistoryText}
      Choose the ${
        difficulty === 'extreme' ? 'optimal move to win or block X, prioritizing wins and traps' :
        difficulty === 'hard' ? 'best move to win or draw, blocking X and setting traps' :
        'strategic move to win or block X, preferring center, corners, then edges'
      }. Return a number (0–8).
      ${userMessage ? `Respond to: "${userMessage}" with witty trash-talk (max 20 words).` : 'Generate playful trash-talk (max 20 words).'}
      Respond in JSON: {"move": number, "chat": string}
    `;

    const response = await fetch('https://api.shapes.inc/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${shapeApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: `shapesinc/${shapeUsername}`,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Shapes API request failed: ${errorText}` }, { status: 500 });
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content?.trim();

    if (!responseText) {
      return NextResponse.json({ error: 'Shapes API returned empty response' }, { status: 500 });
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: `Invalid JSON response from Shapes API: ${responseText}` }, { status: 500 });
    }

    aiMove = parsedResponse.move;
    chatResponse = parsedResponse.chat || (userMessage ? 'Keep talking, I’m winning!' : 'You can’t outsmart me!');

    if (typeof aiMove !== 'number' || isNaN(aiMove) || aiMove < 0 || aiMove > 8 || !validMoves.includes(aiMove)) {
      return NextResponse.json({ error: `Invalid move from Shapes API: ${aiMove}` }, { status: 500 });
    }

    if (!chatResponse) {
      chatResponse = userMessage ? 'Keep talking, I’m winning!' : 'You can’t outsmart me!';
    }

    return NextResponse.json({ move: aiMove, chat: chatResponse });
  } catch (error) {
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
