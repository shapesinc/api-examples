# Shapes API Traffic Monitor — PLAN

## Objective
Build a standalone, non-blocking CLI tool that proxies Shapes API traffic and provides a React/Ink-driven UI for:
  - live request/response logs
  - interactive slash commands (`/exit`, `/explain`)

## High-Level Components
1. **Proxy Skeleton**
   - HTTP server listening on `PORT` (default: 8090)
   - Forwards all `/v1/*` requests to `TARGET_BASE_URL` (env, default: https://api.shapes.inc/v1)
   - Buffers and emits request/response data
   - Minimal console logging for now

2. **Event Emitter**
   - Decouple log output from console
   - Emit `{ type: 'request'|'response', payload }` events after each proxied transaction

3. **CLI UI (Ink + React)**
   - Scrollable log area displaying past requests/responses
   - Input field at bottom with border
   - Help/info bar showing:
       `/` to see commands | listening on http://localhost:8090/v1 | forwarding to http://localhost:8080/v1
   - Mode switching: proxy mode vs. explaining mode

4. **Slash-Command Processor**
   - Commands:
     - `/exit` — stop server and exit process
     - `/explain` — call OpenAI SDK with last request/response + user prompt
   - Non-blocking: runs asynchronously alongside proxy

5. **Explain Integration (OpenAI SDK)**
   - Separate client instance using `OPENAI_API_KEY`
   - Send chat completion request:
       - System prompt: “You are an expert API debugger.”
       - User prompt: includes serialized last request/response + “Explain what is going wrong here.”
   - Display LLM response in UI

6. **Polish & Extend**
   - Add more commands (/retry, /filter, /help)
   - Persist logs, color themes, config file support

## First Step
Implement **Proxy Skeleton** in `index.js`:
  - HTTP server + forward logic
  - Buffer request/response
  - Pretty-print minimal logs to console
  - Ensure upstream errors result in 5xx back to client (no crashes)

After proxy is working, we will
  - introduce the Event Emitter
  - swap console logs for emitted events
  - build the Ink/React UI on top

---
*End of PLAN*