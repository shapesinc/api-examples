🔥 SHAPES INC TELEGRAM 🔥
==============================================

QUICK START GUIDE (SO EASY FR!)
-------------------------------

1. REQUIRED SECRET KEYS
   - TELEGRAM_TOKEN (get from BotFather: https://t.me/botfather)
   - SHAPES_API_KEY (sign up at Shapes Inc)
   - BOT_ADMIN_PASSWORD (set a secure password for access control)
   - SHAPES_MODEL (REQUIRED - your specific Shapes Inc model ID)

2. INSTALLATION (TAKES 60 SECONDS!)
   - Install Python 3.7+ if you don't have it
   - Install requirements: pip install python-telegram-bot openai
   - Set environment variables for your API keys
   - Run: ./deploy.sh (handles everything automatically)

3. 🔥 POWER COMMANDS 🔥
   - @yourshape start: 🟢 Enable auto-reply mode (Shape goes wild!)
   - @yourshape stop: 🔴 Disable auto-reply (Shape chills out)
   - @yourshape reset: 🔄 Wipe conversation history clean
   - /start: 🚀 Boot up with welcome message
   - @yourshape getaccess: 🔑 Get your secret chat ID
   - @yourshape giveaccess: ✅ Grant yourself VIP access

4. 🤖 SHAPE RESPONSE TRIGGERS 🤖
   - In DMs: Always responds to everything (like your clingy ex)
   - In group chats:
     * 🟢 With auto-reply: Jumps into every conversation 
     * 🔖 When tagged with @yourshape: Responds when summoned
     * 💬 When replied to: Continues the conversation thread

5. 🛠️ CUSTOMIZATION OPTIONS 🛠️
   - Edit config.py to hack:
     * 👋 WELCOME_MESSAGE: Your Shape's first impression
     * 📷 MEDIA_RESPONSE: What it says about pics/vids
     * 🧠 MAX_CONTEXT_MESSAGES: Shape's memory capacity

6. 🧪 UPGRADE YOUR SHAPE 🧪
   - Set SHAPES_MODEL to your preferred Shapes Inc model
   - Drop it in your Replit secrets for maximum security

7. 📁 FILE BREAKDOWN 📁
   - main.py: 🚀 The launch button
   - bot.py: 🤖 The Shape's command center
   - config.py: ⚙️ All the tweakable knobs and settings
   - conversation_manager.py: 💬 Message history handler
   - shapes_client.py: 🔌 Shapes Inc connection magic
   - utils.py: 🛠️ Helper tools and utilities 
   - access_manager.py: 🔐 VIP bouncer system

8. 🩹 QUICK FIXES 🩹
   - Shape ghosting you? Double-check that TELEGRAM_TOKEN
   - API errors? Your SHAPES_API_KEY might be partying elsewhere
   - Getting rate limited? Tweak min_request_interval in shapes_client.py

For more detailed information, see README.md