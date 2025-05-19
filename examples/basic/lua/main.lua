-- package.path = package.path .. ";/Users/yeiterilsosingkoireng/.luarocks/share/lua/5.1/?.lua;/Users/yeiterilsosingkoireng/.luarocks/share/lua/5.1/?/init.lua"
-- package.cpath = package.cpath .. ";/Users/yeiterilsosingkoireng/.luarocks/lib/lua/5.1/?.so"
--> update this path as per your configuration
local https = require("ssl.https")
local ltn12 = require("ltn12")
local json = require("dkjson")
local socket = require("socket")  

local shape_api_key = os.getenv("SHAPESINC_API_KEY")
local shape_username = os.getenv("SHAPESINC_SHAPE_USERNAME") or "shaperobot"
local model = "shapesinc/" .. shape_username

local function sendMessage(message)
  local request_body = json.encode({
    model = model,
    messages = {
      { role = "user", content = message }
    }
  })

  local response_body = {}
  local res, code, headers, status = https.request{
    url = "https://api.shapes.inc/v1/chat/completions",
    method = "POST",
    headers = {
      ["Authorization"] = "Bearer " .. shape_api_key,
      ["Content-Type"] = "application/json",
      ["Content-Length"] = tostring(#request_body)
    },
    source = ltn12.source.string(request_body),
    sink = ltn12.sink.table(response_body)
  }

  if code ~= 200 then
    print("HTTP request failed, code:", code)
    return nil
  end

  local response_str = table.concat(response_body)
  local data, pos, err = json.decode(response_str, 1, nil)
  if err then
    print("JSON decode error:", err)
    return nil
  end

  if data.choices and #data.choices > 0 then
    return data.choices[1].message.content
  else
    print("No reply found in response.")
    return nil
  end
end

local function slowPrint(text, delay)
  delay = delay or 0.07 
  local max_total_time = 10 

  local char_count = #text
  local total_time = delay * char_count

  if total_time > max_total_time then
    delay = max_total_time / char_count
  end

  for i = 1, char_count do
    io.write(text:sub(i,i))
    io.flush()
    socket.sleep(delay)
  end
  print()
end


print("Welcome to Shapes.inc chat! Type your message, or 'exit' to quit.")

while true do
  io.write("> ")
  local input = io.read()

  if not input or input:lower() == "exit" then
    print("Goodbye!")
    break
  end

  local reply = sendMessage(input)
  if reply then
    slowPrint("Shapes: " .. reply, 0.07)
  else
    print("No reply received.")
  end
end
