#!/usr/bin/env node

import { config } from "dotenv";
import OpenAI from "openai";

config();

async function main() {
  try {
    const shape_api_key = process.env.SHAPESINC_API_KEY;
    const shape_username = process.env.SHAPESINC_SHAPE_USERNAME;

    // Check for SHAPESINC_API_KEY in .env
    if (!shape_api_key) {
      throw new Error("SHAPESINC_API_KEY not found in .env");
    }

    // Check for SHAPESINC_SHAPE_USERNAME in .env
    if (!shape_username) {
      throw new Error("SHAPESINC_SHAPE_USERNAME not found in .env");
    }

    // Create the client with the shape API key and the Shapes API base URL
    const shapes_client = new OpenAI({
      apiKey: shape_api_key,
      baseURL: "https://api.shapes.inc/v1/"
    });

    // If the user provided a message on the command line, use that one
    const args = process.argv.slice(2);
    const messages = [
      { role: "user", content: args.length > 0 ? args.join(" ") : "Hello. What's your name?" }
    ];

    // Send the message to the Shapes API. This will use the shapes-api model.
    const resp = await shapes_client.chat.completions.create({
      model: `shapesinc/${shape_username}`,
      messages: messages,
    });

    console.log("Raw response:", resp);

    if (resp.choices && resp.choices.length > 0) {
      console.log("Reply:", resp.choices[0].message.content);
    } else {
      console.log("No choices in response:", resp);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();