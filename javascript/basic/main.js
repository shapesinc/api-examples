#!/usr/bin/env node

import { config } from "dotenv";
import OpenAI from "openai";
import readline from "readline";

// Load environment variables from .env (if present)
config();

async function main() {
  // Setup single readline interface for all interaction
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // Helper: ask a question and return the trimmed answer
  const ask = (q) => new Promise((res) => rl.question(q, (ans) => res(ans.trim())));

  // 1) Credentials: from env or prompt
  const apiKey = process.env.SHAPESINC_API_KEY || await ask('Enter your SHAPESINC_API_KEY: ');
  if (!apiKey) {
    console.error('Error: SHAPESINC_API_KEY is required');
    process.exit(1);
  }
  const username = process.env.SHAPESINC_SHAPE_USERNAME || await ask('Enter your SHAPESINC_SHAPE_USERNAME: ');
  if (!username) {
    console.error('Error: SHAPESINC_SHAPE_USERNAME is required');
    process.exit(1);
  }

  // 2) Create Shapes API client
  //    Instantiates an OpenAI client configured for the Shapes API
  const client = new OpenAI({ apiKey, baseURL: 'https://api.shapes.inc/v1/' });
  const model = `shapesinc/${username}`;

  // 3) Start chat REPL (interactive loop)
  console.log('\nStart chatting with Shapes AI! Type "exit" to quit.');
  const history = [];
  rl.setPrompt('You: ');
  rl.prompt();

  rl.on('line', async (line) => {
    const text = line.trim();
    if (text.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      return rl.close();
    }
    if (!text) return rl.prompt();

    // Add user message to history
    history.push({ role: 'user', content: text });

    try {
      // Call the Shapes chat completion endpoint:
      // send full conversation history so the AI can maintain context
      const resp = await client.chat.completions.create({ model, messages: history });
      const reply = resp.choices?.[0]?.message?.content || '';
      console.log(`AI: ${reply}`);

      // Save assistant reply to maintain context
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      console.error('API error:', err);
    }
    rl.prompt();
  });
  // Exit cleanly when readline is closed
  rl.on('close', () => process.exit(0));
}

// Run main and handle unexpected errors
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});