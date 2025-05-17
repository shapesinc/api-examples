import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const shapesClient = new OpenAI({
  apiKey: process.env.SHAPES_API_KEY,
  baseURL: 'https://api.shapes.inc/v1',
});

export async function POST(request) {
  try {
    const { messages, model } = await request.json();

    const response = await shapesClient.chat.completions.create({
      model: `shapesinc/${model}`,
      messages,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch response' }, { status: 500 });
  }
}
