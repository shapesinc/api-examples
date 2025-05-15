 Here's the instructions.

# SILLY TAVERN SHAPES INTEGRATION

## ST CONFIGURATION

- API: follow instructions for obtaining the shape's API
- Character: placeholder character
- Lorebook: no active lorebook
- System Prompt: blank, your shape uses the one from the shapes dashboard

## STEP BY STEP

**Prerequisites**
- Updated version of Silly Tavern
- Your Shape's API

STEP 1: API
1. After starting Silly Tavern open the API Connections tab
2. For API dropdown choose "chat completion"
3. Chat completion source is "Custom (OpenAI-compatible)
4. Custom endpoint: `https://api.shapes.inc/v1`
5. Custom API Key: your api
6. Model ID: `shapesinc/<shapes-id>` (do NOT put a period between "shapes" and "inc")

STEP 2: CHARACTER SHELL
1. Create a NEW character
2. Upload a picture if you wish but do not put any character info in (this "character" is just a placeholder)

STEP 3: SYSTEM PROMPT
1. Go to the AI Response Configuration tab at the top
2. Disable the box that says "Streaming"

STEP 4: DISABLE LOREBOOKS
1. Ensure there are no world lorebooks applied (your shape will use the knowledge from the shapes knowledge database)

STEP 5: CHAT
*Click on the character you made and it will open a new chat. Send a message and your shape will respond as if it were the next message from your DM history.*