# shape-debug

CLI tool to proxy Shapes API traffic and provide live request/response logs and interactive slash commands.

## Installation

### From npm registry

```bash
npm install -g shape-debug
```

### From local source

```bash
git clone <repository-url>
cd shape-debug
npm install
npm link
```

## Usage

Run the proxy (defaults: PORT=8090, TARGET_BASE_URL=https://api.shapes.inc/v1):

```bash
shape-debug
```

Override defaults with environment variables:

```bash
PORT=3000 TARGET_BASE_URL=http://localhost:8080/v1 shape-debug
```

Requests sent to `http://localhost:<PORT>/v1/*` will be forwarded to the target and logged.

## Example

```bash
curl http://localhost:8090/v1/healthcheck
```

The console will pretty-print the request and response details.