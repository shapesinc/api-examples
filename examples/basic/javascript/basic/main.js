#!/usr/bin/env node

import { config } from "dotenv";
import OpenAI from "openai";
import { parseArgs } from "node:util";

config();

async function main() {
  try {
    // Parse command line arguments
    const options = {
      userId: { type: "string" },
      channelId: { type: "string" }
    };
    
    const { values, positionals } = parseArgs({
      options: options,
      allowPositionals: true
    });

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
    const userMessage = positionals.length > 0 ? positionals.join(" ") : "Hello. What's your name?";
    const messages = [
      { role: "user", content: userMessage }
    ];

    // Set up headers for user identification and conversation context
    const headers = {};
    if (values.userId) {
      headers["X-User-Id"] = values.userId;  // If not provided, all requests will be attributed to
      // the user who owns the API key. This will cause unexpected behavior if you are using the same API
      // key for multiple users. For production use cases, either provide this header or obtain a
      // user-specific API key for each user.
    }

    // Only add channel ID if provided
    if (values.channelId) {
      headers["X-Channel-Id"] = values.channelId;  // If not provided, all requests will be attributed to
      // the user. This will cause unexpected behavior if interacting with multiple users
      // in a group.
    }

    // Send the message to the Shapes API. This will use the shapes-api model.
    const resp = await shapes_client.chat.completions.create({
      model: `shapesinc/${shape_username}`,
      messages: messages,
      extra_headers: headers,
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