#!/usr/bin/env node

import { config } from "dotenv";
import OpenAI from "openai";
import fs from "fs";

config();

async function main() {
    try {
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

        // Create the client with the shape API key and the Shapes API base URL
        const shapes_client = new OpenAI({
            apiKey: shape_api_key,
            baseURL: "https://api.shapes.inc/v1/",
        });

        // Get image file path from command line argument
        const args = process.argv.slice(2);
        if (args.length !== 1) {
            throw new Error("Please provide exactly one image file path as argument");
        }
        const imagePath = args[0];

        // Read and encode image
        const imageData = fs.readFileSync(imagePath).toString('base64');
        const imageMimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

        // Make API call with image
        const resp = await shapes_client.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "What do you think about this image" },
                        { type: "image_url", image_url: { url: `data:${imageMimeType};base64,${imageData}` } }
                    ]
                }
            ]
        });

        // Print response
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