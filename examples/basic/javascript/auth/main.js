#!/usr/bin/env node

import { config } from "dotenv";
import OpenAI from "openai/index.mjs";
import axios from "axios";
import readline from "readline";
import { getApiBaseUrl, getAuthBaseUrl, getSiteBaseUrl } from "../utils.js";
import chalk from "chalk";

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

        let apiUrl = 'https://api.shapes.inc/v1';
        let authUrl = 'https://api.shapes.inc/auth';
        let siteUrl = 'https://shapes.inc';

        await (async () => {
            apiUrl = await getApiBaseUrl()
            authUrl = await getAuthBaseUrl()
            siteUrl = await getSiteBaseUrl()
        })()

        console.log(chalk.magenta('→ API URL :'), apiUrl)
        console.log(chalk.magenta('→ Model   :'), model)
        console.log(chalk.magenta('→ App ID  :'), shape_app_id)

        console.log("\n")

        // If the user provided a message on the command line, use that one
        const args = process.argv.slice(2);
        const messages = [
            { role: "user", content: args.length > 0 ? args.join(" ") : "Hello. Do you know my name?" }
        ];

        // Before authorization, the API calls require an API key
        // The API key is used to authenticate the application

        const shapes_client = new OpenAI({
            apiKey: shape_api_key,
            baseURL: apiUrl,
        });

        // Send the message to the Shapes API with the API key
        // This will use the API key rate limits
        const non_auth_resp = await shapes_client.chat.completions.create({
            model: model,
            messages: messages,
        });

        console.log(chalk.gray("Raw response (non-auth):"), non_auth_resp);

        console.log("\n")

        if (non_auth_resp.choices && non_auth_resp.choices.length > 0) {
            console.log(chalk.green("Reply (non-auth):"), non_auth_resp.choices[0].message.content);
        } else {
            console.log(chalk.red("No choices in response (non-auth):"), non_auth_resp);
        }

        console.log("\n")

        // STEP 1: App starts the authorize flow by directing the user to the authorize page
        // where the user will be asked to log in to their Shapes account and approve the authorization request

        // Start the authorize flow
        console.log("Click on the link to authorize the application:")
        console.log(chalk.blue(`${siteUrl}/authorize?app_id=${shape_app_id}`))

        // STEP 2: User logs in to their Shapes account and approves the authorization request
        // The user will be given a one-time token to present back to the app
        // The user will be asked to copy and paste the token here
        // (passing the token back to the app through a return URL is not implemented yet)

        // Read from the user the one time code
        console.log("\n")
        console.log("After you login to Shapes Inc and approve the authorization request,\nyou will be given a one-time code.\nCopy and paste that code here.")
        const code = await new Promise((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            rl.question(chalk.magenta("Enter the one-time code: "), (code) => {
                rl.close();
                resolve(code);
            });
        });

        // STEP 3: The application exchanges the one-time code for a long-lived user auth token
        // This is the only time the application will have access to the user auth token
        // through the Shapes API, so it should store that token somewhere safe.
        // To exchange the one-time code for a user auth token, the app needs to provide
        // application id and the one-time code
        // The API can get the application id from the API key, from the X-App-ID header
        // or from app_id in the body

        // Exchange the one-time code for a user auth token
        const response = await axios.post(`${authUrl}/nonce`, {
            app_id: shape_app_id,
            code: code,
        });
        const shape_user_auth_token = response.data.auth_token;

        console.log("\n")

        // WARNING: This is just for example purposes. DO NOT show the auth token
        // in a production application. Threat it as if it were a password.
        console.log(chalk.magenta("User auth token: ", shape_user_auth_token));

        // STEP 4: The application creates a client with the shape API key / base URL
        // and X-User-Auth header set to the user auth token it stored from the previous step

        // This call can be made without an API key if the X-App-ID and X-User-Auth headers are set
        const auth_shapes_client = new OpenAI({
            apiKey: "not-needed",
            baseURL: apiUrl,
            defaultHeaders: {
                "X-App-ID": shape_app_id,
                "X-User-Auth": shape_user_auth_token,
            },
        });

        // STEP 5: The application can now use the client to make requests to the Shapes API
        // on behalf of the user. These requests will be authenticated as the user and will
        // be rate limited separately, and will allow the user to continue their conversation
        // with their favorite shapes from other places.

        // Send the message to the Shapes API. This will use the shapes-api model.
        const resp = await auth_shapes_client.chat.completions.create({
            model: model,
            messages: messages,
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