#!/usr/bin/env node

import { config } from "dotenv";
import OpenAI from "openai/index.mjs";
import axios from "axios";
import readline from "readline";

config();

async function main() {
  try {
    const shape_api_key = process.env.SHAPESINC_API_KEY;
    const shape_app_id = process.env.SHAPESINC_APP_ID;
    const shape_username = process.env.SHAPESINC_SHAPE_USERNAME;

    // Check for SHAPESINC_API_KEY in .env
    if (!shape_api_key) {
      throw new Error("SHAPESINC_API_KEY not found in .env");
    }

    // Check for SHAPESINC_APP_ID in .env
    if (!shape_app_id) {
      throw new Error("SHAPESINC_APP_ID not found in .env");
    }

    // Check for SHAPESINC_SHAPE_USERNAME in .env
    if (!shape_username) {
      throw new Error("SHAPESINC_SHAPE_USERNAME not found in .env");
    }

    // const baseSiteUrl = "https://shapes.inc";
    const baseSiteUrl = "http://localhost:3000";

    console.log("Click on the link to authorize the application:")
    console.log(`${baseSiteUrl}/authorize?app_id=${shape_app_id}`)

    // Read from the user the nonce
    const nonce = await new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question("Enter the nonce: ", (nonce) => {
        rl.close();
        resolve(nonce);
      });
    });


    // const baseAuthUrl = "https://api.shapes.inc/auth";
    const baseAuthUrl = "http://localhost:8080/auth";

    // Exchange nonce for user auth token
    // Add the shape_api_key as Authorization header
    const response = await axios.post(`${baseAuthUrl}/nonce`, {
      app_id: shape_app_id,
      nonce: nonce,
    }, {
      headers: {
        Authorization: `Bearer ${shape_api_key}`,
      },
    });
    const shape_user_auth_token = response.data.auth_token;
    console.log("User auth token:", shape_user_auth_token);

    // Create the client with the shape API key and the Shapes API base URL
    // and X-User-Auth header set to the shape_user_auth_token
    const shapes_client = new OpenAI({
      apiKey: shape_api_key,
      baseURL: "https://api.shapes.inc/v1/",
      headers: {
        "X-User-Auth": shape_user_auth_token,
      },
    });

    // If the user provided a message on the command line, use that one
    const args = process.argv.slice(2);
    const messages = [
      { role: "user", content: args.length > 0 ? args.join(" ") : "Hello. Do you know my name?" }
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