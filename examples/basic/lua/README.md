# Shapes.inc Lua Chat Client

A simple command-line chat client for interacting with Shapes.inc AI models using Lua.

## Features

- Connect to Shapes.inc API to chat with AI models
- Local module management for portability
- Character-by-character text display for a more natural chat experience
- Simple command-line interface

## Prerequisites

- Lua 5.1 or higher
- Required Lua modules (included in `lua_modules` folder):
  - dkjson
  - luasocket
  - luasec (for SSL/HTTPS)

## Installation & Setup
 --> follow this get started https://www.lua.org/start.html
### 1. Clone or Download the Project

```bash
git clone https://github.com/shapesinc/examples/basic/lua
cd lua
```

### 2. Environment Variables

Set up the following environment variables:

```bash
export SHAPESINC_API_KEY="your_api_key_here"
export SHAPESINC_SHAPE_USERNAME="shaperobot"  # or your custom bot username
```


### 3. Ensure `lua_modules` Contains Required Libraries

The folder structure should look like:

```
lua/
├── lua_modules/
│   ├── dkjson.lua
│   ├── mime.lua
│   ├── socket.lua
│   ├── ssl.lua
│   └── ... (other modules)
└── test.lua
```

If you don't have the required modules, you can copy them from your local LuaRocks installation:

```bash
cp -r ~/.luarocks/share/lua/5.1/dkjson.lua ./lua_modules/
cp -r ~/.luarocks/share/lua/5.1/socket* ./lua_modules/
cp -r ~/.luarocks/share/lua/5.1/ssl* ./lua_modules/
cp -r ~/.luarocks/share/lua/5.1/mime* ./lua_modules/
cp -r ~/.luarocks/share/lua/5.1/ltn12* ./lua_modules/
# Copy any other required modules
```

For compiled modules (.so files), copy them as well:

```bash
mkdir -p ./lua_modules/socket
cp ~/.luarocks/lib/lua/5.1/socket/*.so ./lua_modules/socket/
cp ~/.luarocks/lib/lua/5.1/ssl.so ./lua_modules/
```
Or Either export the path like this
```
package.path = package.path .. ";/Users/username/.luarocks/share/lua/5.1/?.lua;/Users/username/.luarocks/share/lua/5.1/?/init.lua"
package.cpath = package.cpath .. ";/Users/username/.luarocks/lib/lua/5.1/?.so"
```

### 4. Running the Chat Client

From the project root directory:

```bash
lua main.lua
```

## Usage

1. Once the program starts, you'll see a welcome message
2. Type your message after the `>` prompt
3. The AI will respond 
4. Type `exit` to quit the program

Example session:
```
Welcome to Shapes.inc chat! Type your message, or 'exit' to quit.
> Hello, how are you today?
Shapes: I'm doing well, thank you for asking! How can I help you today?
> exit
Goodbye!
```

## Troubleshooting

- **API Connection Issues**: Make sure your API key is set correctly and you have internet connectivity
- **Module Not Found Errors**: Ensure all required modules are in the `lua_modules` directory
- **Permission Denied**: Make sure the script has execute permissions (`chmod +x test.lua`)

## Custom Configuration

You can modify the following variables in `test.lua` to customize the behavior:

- `delay`: Controls the speed of character-by-character printing (default: 0.07 seconds)
- `model`: Change to use different Shapes.inc models
- `max_total_time`: Maximum time for printing responses (default: 10 seconds)

## License

MIT LICENSE

## Acknowledgments

- Shapes.inc for providing the AI API
- Lua community for the excellent modules used in this project