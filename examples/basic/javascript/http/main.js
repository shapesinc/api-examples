#!/usr/bin/env node

import { config } from "dotenv";
import axios from "axios";
import readline from "readline";

// Load environment variables from .env file
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

        // Create readline interface for command-line input
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Function to send message to the Shapes API
        async function sendMessage(text) {
            try {
                const response = await axios.post(
                    "https://api.shapes.inc/v1/chat/completions",
                    {
                        model: `shapesinc/${shape_username}`,
                        messages: [{ role: "user", content: text }]
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${shape_api_key}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                console.log("Raw response:", response.data);

                if (response.data.choices && response.data.choices.length > 0) {
                    console.log("Reply:", response.data.choices[0].message.content);
                } else {
                    console.log("No choices in response:", response.data);
                }
            } catch (error) {
                console.error(
                    "Error:",
                    error.response ? `${error.response.status} - ${error.response.data}` : error.message
                );
            }
        }

        // Function to prompt user for input
        function promptUser() {
            rl.question("Enter your message (or type 'exit' to quit): ", async (input) => {
                if (input.toLowerCase() === "exit") {
                    rl.close();
                    return;
                }

                if (input.trim()) {
                    await sendMessage(input);
                } else {
                    console.log("Please enter a non-empty message.");
                }

                promptUser();
            });
        }

        // Start the app
        console.log("Chat API App - Type a message to send to the Shapes API.");
        promptUser();

        // Handle readline close
        rl.on("close", () => {
            console.log("Exiting app.");
            process.exit(0);
        });
    } catch (error) {
        console.error("Error:", error.message);
    }
}

main();