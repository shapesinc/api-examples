#!/usr/bin/env node

import { config } from "dotenv";
import OpenAI from "openai";
import { parseArgs } from "node:util";
import { getApiBaseUrl } from "../utils.js";
import chalk from "chalk";

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

        let shape_api_key = process.env.SHAPESINC_API_KEY;
        let shape_app_id = process.env.SHAPESINC_APP_ID;
        let shape_username = process.env.SHAPESINC_SHAPE_USERNAME;

        // Check for SHAPESINC_API_KEY in .env
        if (!shape_api_key) {
            throw new Error("SHAPESINC_API_KEY not found in .env");
        }

        // Check for SHAPESINC_APP_ID in .env
        if (!shape_app_id) {
            // Default app ID for Euclidian - the Shapes API testing app
            shape_app_id = "f6263f80-2242-428d-acd4-10e1feec44ee"
        }

        // Check for SHAPESINC_SHAPE_USERNAME in .env
        if (!shape_username) {
            // Default shape username for Shape Robot - the Shapes API developer shape
            shape_username = "shaperobot"
        }

        const model = `shapesinc/${shape_username}`;

        let apiUrl = 'https://api.shapes.inc/v1';

        await (async () => {
            apiUrl = await getApiBaseUrl()
        })()

        console.log(chalk.magenta('→ API URL :'), apiUrl)
        console.log(chalk.magenta('→ Model   :'), model)
        console.log(chalk.magenta('→ App ID  :'), shape_app_id)

        console.log("\n")

        // If the user provided a message on the command line, use that one
        const userMessage = positionals.length > 0 ? positionals.join(" ") : "Hello. What's your name?";
        const messages = [
            { role: "user", content: userMessage }
        ];

        // Create the client with the shape API key and the Shapes API base URL
        const shapes_client = new OpenAI({
            apiKey: shape_api_key,
            baseURL: apiUrl
        });

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
            model: model,
            messages: messages,
            headers: headers,
        });

        console.log(chalk.gray("Raw response:"), resp);

        console.log("\n")

        if (resp.choices && resp.choices.length > 0) {
            console.log(chalk.green("Reply:"), resp.choices[0].message.content);
        } else {
            console.log(chalk.red("No choices in response:"), resp);
        }
    } catch (error) {
        console.error(chalk.red("Error:"), error);
    }
}

main();