#!/usr/bin/env python3

import os
import asyncio
import httpx
from dotenv import load_dotenv
import json

# Load environment variables from .env file
load_dotenv()


async def run():
    try:
        shape_api_key = os.getenv("SHAPESINC_API_KEY")
        shape_username = os.getenv("SHAPESINC_SHAPE_USERNAME")

        # Check for SHAPESINC_API_KEY in .env
        if not shape_api_key:
            raise ValueError("SHAPESINC_API_KEY not found in .env")

        # Check for SHAPESINC_SHAPE_USERNAME in .env
        if not shape_username:
            raise ValueError("SHAPESINC_SHAPE_USERNAME not found in .env")

        async def send_message(text):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.shapes.inc/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {shape_api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": f"shapesinc/{shape_username}",
                            "messages": [{"role": "user", "content": text}],
                        },
                    )

                response.raise_for_status()
                resp_data = response.json()

                print(f"Raw response: {resp_data}\n")

                if resp_data.get("choices") and len(resp_data["choices"]) > 0:
                    final_response = resp_data["choices"][0]["message"]["content"]
                    print(f"Reply: {final_response}")
                else:
                    print(f"No choices in response: {resp_data}")

            except httpx.HTTPStatusError as e:
                print(f"Error: HTTP {e.response.status_code} - {e.response.text}")
            except Exception as e:
                print(f"Error: {e}")

        async def prompt_user():
            while True:
                try:
                    # Use input() for synchronous input within async context
                    user_input = await asyncio.get_event_loop().run_in_executor(
                        None,
                        lambda: input("Enter your message (or type 'exit' to quit): "),
                    )

                    if user_input.lower() == "exit":
                        break

                    if user_input.strip():
                        await send_message(user_input)
                    else:
                        print("Please enter a non-empty message.")

                except KeyboardInterrupt:
                    print("\nExiting app.")
                    break

        print("Chat API App - Type a message to send to the Shapes API.")
        await prompt_user()

    except Exception as e:
        print(f"Error: {e}")


def main():
    asyncio.run(run())


if __name__ == "__main__":
    main()
