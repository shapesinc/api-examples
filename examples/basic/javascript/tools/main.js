#!/usr/bin/env node

import { config } from "dotenv";
import OpenAI from "openai";
import { parseArgs } from "node:util";
import { getApiBaseUrl } from "../utils.js";
import chalk from "chalk";
import fs from "fs";

config();

async function main() {
    try {
        // Parse command line arguments
        const options = {
            userId: { type: "string" },
            channelId: { type: "string" },
        };

        const { values, positionals } = parseArgs({
            options: options,
            allowPositionals: true,
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
            shape_app_id = "f6263f80-2242-428d-acd4-10e1feec44ee";
        }

        // Check for SHAPESINC_SHAPE_USERNAME in .env
        if (!shape_username) {
            // Default shape username for Shape Robot - the Shapes API developer shape
            shape_username = "shaperobot";
        }

        const model = `shapesinc/${shape_username}`;

        let apiUrl = "https://api.shapes.inc/v1";

        await (async () => {
            apiUrl = await getApiBaseUrl();
        })();

        console.log(chalk.magenta("→ API URL :"), apiUrl);
        console.log(chalk.magenta("→ Model   :"), model);
        console.log(chalk.magenta("→ App ID  :"), shape_app_id);

        console.log("\n");

        // If the user provided a message on the command line, use that one
        const userMessage =
            positionals.length > 0
                ? positionals.join(" ")
                : "Sparkles hasn't responded to my previous email, could you send her another one to make sure she follows up?";
        const messages = [{ role: "user", content: userMessage }];

        // Create the client with the shape API key and the Shapes API base URL
        const shapes_client = new OpenAI({
            apiKey: shape_api_key,
            baseURL: apiUrl,
        });

        // Set up headers for user identification and conversation context
        const headers = {};
        if (values.userId) {
            headers["X-User-Id"] = values.userId; // If not provided, all requests will be attributed to
            // the user who owns the API key. This will cause unexpected behavior if you are using the same API
            // key for multiple users. For production use cases, either provide this header or obtain a
            // user-specific API key for each user.
        }

        // Only add channel ID if provided
        if (values.channelId) {
            headers["X-Channel-Id"] = values.channelId; // If not provided, all requests will be attributed to
            // the user. This will cause unexpected behavior if interacting with multiple users
            // in a group.
        }

        // Define the add tool
        const tools = [
            {
                type: "function",
                function: {
                    name: "add",
                    description: "Add two numbers",
                    parameters: {
                        type: "object",
                        properties: {
                            a: { type: "number" },
                            b: { type: "number" },
                        },
                        required: ["a", "b"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "search_email",
                    description: "Search my emails",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string" },
                        },
                        required: ["query"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "send_email",
                    description: "Send an email",
                    parameters: {
                        type: "object",
                        properties: {
                            to: { type: "string" },
                            subject: { type: "string" },
                            body: { type: "string" },
                        },
                        required: ["to", "subject", "body"],
                    },
                },
            },
        ];

        // First API call
        const resp = await shapes_client.chat.completions.create({
            model: model,
            messages: messages,
            tools: tools,
            tool_choice: "required",
            headers: headers, // Added headers
        });

        console.log(
            chalk.gray("Raw response (1st call):"),
            JSON.stringify(resp, null, 2)
        );

        console.log("\n");

        // Check for tool calls
        if (resp.choices && resp.choices[0].message.tool_calls) {
            const tool_calls = resp.choices[0].message.tool_calls;
            console.log(
                chalk.blue("Tool calls:"),
                JSON.stringify(tool_calls, null, 2)
            );
            console.log("\n");

            // Append assistant message with tool calls
            messages.push({
                role: "assistant",
                tool_calls: tool_calls.map((tc) => ({
                    id: tc.id,
                    type: tc.type,
                    function: {
                        name: tc.function.name,
                        arguments: tc.function.arguments,
                    },
                })),
            });

            // Process each tool call
            for (const tool_call of tool_calls) {
                if (tool_call.function.name === "add") {
                    // Parse arguments
                    const args = JSON.parse(tool_call.function.arguments);
                    const a = args.a;
                    const b = args.b;
                    const result = a + b;

                    // Append tool result message
                    messages.push({
                        role: "tool",
                        content: String(result),
                        tool_call_id: tool_call.id,
                    });
                }
                if (tool_call.function.name === "search_email") {
                    // Parse arguments
                    const args = JSON.parse(tool_call.function.arguments);
                    const query = args.query;

                    // Read fake emails from file
                    const fakeEmailsContent = fs.readFileSync(
                        "./fake_emails.json",
                        "utf-8"
                    );
                    const fakeEmails = JSON.parse(fakeEmailsContent);

                    messages.push({
                        role: "tool",
                        content: JSON.stringify(
                            fakeEmails.filter(
                                (email) =>
                                    email.body
                                        .toLowerCase()
                                        .includes(query.toLowerCase()) ||
                                    email.from
                                        .toLowerCase()
                                        .includes(query.toLowerCase())
                            )
                        ),
                        tool_call_id: tool_call.id,
                    });
                }
                if (tool_call.function.name === "send_email") {
                    // Parse arguments
                    const args = JSON.parse(tool_call.function.arguments);
                    const to = args.to;
                    const subject = args.subject;
                    const body = args.body;

                    console.log(
                        chalk.yellow("Simulating sending email to:"),
                        to,
                        chalk.yellow("subject:"),
                        subject,
                        chalk.yellow("body:"),
                        body
                    );
                    console.log("\n");

                    // Append tool result message
                    messages.push({
                        role: "tool",
                        content: JSON.stringify({
                            to: to,
                            subject: subject,
                            body: body,
                            result: "Email sent successfully",
                        }),
                        tool_call_id: tool_call.id,
                    });
                }
            }

            // Second API call with tool results
            const secondResp = await shapes_client.chat.completions.create({
                model: model,
                messages: messages,
                tools: tools,
                tool_choice: "none",
                headers: headers, // Added headers
            });

            console.log(
                chalk.gray("Raw response (2nd call):"),
                JSON.stringify(secondResp, null, 2)
            );
            console.log("\n");

            // Print final response
            if (secondResp.choices && secondResp.choices.length > 0) {
                console.log(
                    chalk.green("Reply:"),
                    secondResp.choices[0].message.content
                );
            } else {
                console.log(
                    chalk.red("No choices in second response:"),
                    secondResp
                );
            }
        } else {
            // Print response if no tool calls
            if (resp.choices && resp.choices.length > 0) {
                console.log(
                    chalk.green("Reply:"),
                    resp.choices[0].message.content
                );
            } else {
                console.log(chalk.red("No choices in response:"), resp);
            }
        }
    } catch (error) {
        console.error(chalk.red("Error:"), error);
    }
}

main();
