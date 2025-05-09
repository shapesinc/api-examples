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

    // The base URLs for the different parts of the flow
    const baseSiteUrl = "https://shapes.inc";
    const baseAuthUrl = "https://api.shapes.inc/auth";
    const baseApiUrl = "https://api.shapes.inc/v1";


    // STEP 1: App starts the authorize flow by directing the user to the authorize page
    // where the user will be asked to log in to their Shapes account and approve the authorization request

    console.log("Click on the link to authorize the application:")
    console.log(`${baseSiteUrl}/authorize?app_id=${shape_app_id}`)

    // STEP 2: User logs in to their Shapes account and approves the authorization request
    // The user will be given a one-time token to present back to the app
    // The user will be asked to copy and paste the token here
    // (passing the token back to the app through a return URL is not implemented yet)

    // Read from the user the nonce
    console.log("\n")
    console.log("After you login to Shapes Inc and approve the authorization request,\nyou will be given a one-time token.\nCopy and paste that token here.")
    const nonce = await new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question("Enter the token: ", (nonce) => {
        rl.close();
        resolve(nonce);
      });
    });

    // STEP 3: The application exchanges the nonce for a long-lived user auth token
    // This is the only time the application will have access to the user auth token
    // through the Shapes API, so it should store that token somewhere safe.

    const response = await axios.post(`${baseAuthUrl}/nonce`, {
      app_id: shape_app_id,
      nonce: nonce,
    }, {
      headers: {
        Authorization: `Bearer ${shape_api_key}`,
      },
    });
    const shape_user_auth_token = response.data.auth_token;

    // WARNING: This is just for example purposes. DO NOT show the auth token
    // in a production application. Threat it as if it were a password.
    console.log("User auth token:", shape_user_auth_token);

    // STEP 4: The application creates a client with the shape API key / base URL
    // and X-User-Auth header set to the user auth token it stored from the previous step
    
    const shapes_client = new OpenAI({
      apiKey: shape_api_key,
      baseURL: baseApiUrl,
      headers: {
        "X-User-Auth": shape_user_auth_token,
      },
    });

    // STEP 5: The application can now use the client to make requests to the Shapes API
    // on behalf of the user. These requests will be authenticated as the user and will
    // be rate limited separately, and will allow the user to continue their conversation
    // with their favorite shapes from other places.

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