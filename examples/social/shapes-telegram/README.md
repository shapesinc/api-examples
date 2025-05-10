# 🔥 Telegram Shape 🔥

What's up! This Telegram Shape is powered by the cutting-edge Shapes Inc AI - instant, intelligent chat that's so easy to deploy even your grandma could do it! 🤖 ✨

## 🚀 Epic Features

- ✅ Advanced Telegram integration with multi-message type support
- ✅ Context-aware convo management across chats/groups/threads
- ✅ Smart auto-reply mode
- ✅ Secure access control system to keep the normies out

## 🎮 Power Commands

- 💬 `/start` - Boot up your Shape with welcome message
- 🟢 `@shape start` - Enable auto-reply mode (Shape replies to everything)
- 🔴 `@shape stop` - Disable auto-reply (Shape only replies when tagged)
- 🔄 `@shape reset` - Wipe conversation history
- 🔑 `@shape getaccess` - Grab your chat ID for approval
- ✅ `@shape giveaccess [password]` - Grant yourself access with admin password
- 🔐 `@shape approve [chat_id] [password]` - Approve another chat ID
- ⛔ `@shape revoke [chat_id] [password]` - Revoke access for a chat ID

## 🛠️ Setup (So Easy FR!)

You need these environment variables (they're like secret keys to the kingdom):

- 🔑 `TELEGRAM_TOKEN` - Your Telegram token from BotFather
- 🔑 `SHAPES_API_KEY` - Your Shapes Inc API key
- 🔑 `BOT_ADMIN_PASSWORD` - Password for approving access
- 🔑 `SHAPES_MODEL` - Your Shapes Inc model ID (REQUIRED)

## 🚀 Deployment in 60 Seconds

### 🔥 Deploy Like a Pro 🔥

1. Set these secrets (don't skip any!):
   - ✅ TELEGRAM_TOKEN - Your Telegram token
   - ✅ SHAPES_API_KEY - Your Shapes API key
   - ✅ BOT_ADMIN_PASSWORD - Make it strong!
   - ✅ SHAPES_MODEL - Your model ID

2. Deploy settings (copy exactly):
   - ✅ Run command: `./deploy.sh`  
   - ✅ Build command: (leave empty)
   - ✅ VM Resources: Bare min

This script handles everything automatically - it starts a web server AND your Shape in one go. Just deploy and chill! Tbh you dont need the sever but its nice to have for ez deploy on any platform 😎

## 🔧 Advanced Customization

Want to make it even more awesome? Edit these files:

- 🛠️ `config.py` - Customize welcome messages and settings
- 🧠 `conversation_manager.py` - Tweak memory and conversation flow
- 🤖 `shapes_client.py` - Fine-tune your Shapes Inc model connection

### 🤖 Model Configuration

The Shape uses your Shapes Inc model through the SHAPES_MODEL variable.

Two ways to set it up:
1. ✅ Add SHAPES_MODEL to your environment
2. ✅ Add SHAPES_MODEL to your Secrets

That's it! You're all set to rule your chat empire! 🎮 🚀