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

    const model = `shapesinc/${shape_username}`;

    // Create the client with the shape API key and the Shapes API base URL
    const shapes_client = new OpenAI({
      apiKey: shape_api_key,
      baseURL: "https://api.shapes.inc/v1/"
    });

    // If the user provided a message on the command line, use that one
    const args = process.argv.slice(2);
    const messages = [
      { role: "user", content: args.length > 0 ? args.join(" ") : "Can you search my emails for anything related to My Little Pony?" }
    ];

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
              b: { type: "number" }
            },
            required: ["a", "b"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_email",
          description: "Search my emails",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string" }
            },
            required: ["query"]
          }
        }
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
              body: { type: "string" }
            },
            required: ["to", "subject", "body"]
          }
        }
      }
    ];

    // First API call
    const resp = await shapes_client.chat.completions.create({
      model: model,
      messages: messages,
      tools: tools,
      tool_choice: "required"
    });

    console.log("Raw response:", JSON.stringify(resp, null, 2));

    // Check for tool calls
    if (resp.choices && resp.choices[0].message.tool_calls) {
      const tool_calls = resp.choices[0].message.tool_calls;
      console.log("Tool calls:", JSON.stringify(tool_calls, null, 2));

      // Append assistant message with tool calls
      messages.push({
        role: "assistant",
        tool_calls: tool_calls.map(tc => ({
          id: tc.id,
          type: tc.type,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments
          }
        }))
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
            tool_call_id: tool_call.id
          });
        }
        if (tool_call.function.name === "search_email") {
          // Parse arguments
          const args = JSON.parse(tool_call.function.arguments);
          const query = args.query;

          // Append tool result message
          messages.push({
            role: "tool",
            content: JSON.stringify([
              {
                from: "Sparkles",
                body: "My Little Pony is the best!"
              },
              {
                from: "Sparkles",
                body: "The best show ever! The power of friendship and loyalty is unmatched."
              },
              {
                from: "Sparkles",
                body: "hey, I got the job! I will be an actor! See you on TV!"
              }
            ]),
            tool_call_id: tool_call.id
          });
        }
        if (tool_call.function.name === "send_email") {
          // Parse arguments
          const args = JSON.parse(tool_call.function.arguments);
          const to = args.to;
          const subject = args.subject;
          const body = args.body;

          console.log("Sending email to:\n", to, "\nsubject:\n", subject, "\nbody:\n", body);

          // Append tool result message
          messages.push({
            role: "tool",
            content: JSON.stringify({
              to: to,
              subject: subject,
              body: body,
              result: "Email sent successfully"
            }),
            tool_call_id: tool_call.id
          });
        }
      }

      // Second API call with tool results
      const secondResp = await shapes_client.chat.completions.create({
        model: model,
        messages: messages,
        tools: tools,
        tool_choice: "none"
      });

      console.log("Second raw response:", JSON.stringify(secondResp, null, 2));

      // Print final response
      if (secondResp.choices && secondResp.choices.length > 0) {
        console.log("Reply:", secondResp.choices[0].message.content);
      } else {
        console.log("No choices in second response:", secondResp);
      }
    } else {
      // Print response if no tool calls
      if (resp.choices && resp.choices.length > 0) {
        console.log("Reply:", resp.choices[0].message.content);
      } else {
        console.log("No choices in response:", resp);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();