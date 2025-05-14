#!/usr/bin/env node

import { config } from "dotenv";
import OpenAI from "openai/index.mjs";
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

        console.log("\n")

        // Create the client with the shape API key and the Shapes API base URL
        const shapes_client = new OpenAI({
            apiKey: shape_api_key,
            baseURL: apiUrl
        });

        // Fetch the list of the user's recent shapes as models
        // This list will be dependent on the type of call authentication,
        // so it can fetch the shapes either for the API key creator or the auth token user
        shapes_client.models.list().then((models) => {
            console.log(models);
        });
    } catch (error) {
        console.error(chalk.red("Error:"), error);
    }
}

main();