#!/usr/bin/env node
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import chalk from 'chalk';
import { getApiBaseUrl } from './src/utils.js';
/**
 * Mask a token showing only the last 4 characters.
 * @param {string} token
 * @returns {string}
 */
function maskToken(token) {
  const t = String(token || '');
  const last = t.slice(-4);
  return '****' + last;
}

// Configuration
const PORT    = process.env.PORT || 8090;
// Determine upstream API base URL (debug proxy or production)
const baseUrl = await getApiBaseUrl();

/**
 * Pretty-print an HTTP request header and body (minimal skeleton)
 */
function prettyPrintRequest(req, bodyBuf) {
  console.log(chalk.bold.underline('\n=== Request ==='));
  console.log(chalk.bold('Method:'), req.method);
  console.log(chalk.bold('URL:'), req.url);

  // Headers
  console.log(chalk.bold('Headers:'));
  for (const [name, val] of Object.entries(req.headers)) {
    const value = Array.isArray(val) ? val.join(', ') : val;
    let display = value;
    const lower = name.toLowerCase();
    if (lower === 'authorization') {
      const parts = String(value).split(' ');
      if (parts.length > 1) {
        const scheme = parts.shift();
        const token = parts.join(' ');
        display = `${scheme} ${maskToken(token)}`;
      } else {
        display = maskToken(value);
      }
    } else if (lower === 'x-user-auth') {
      display = maskToken(value);
    }
    console.log(`  ${name}: ${display}`);
  }

  // Body
  if (bodyBuf && bodyBuf.length) {
    console.log(chalk.bold('Body:'));
    const str = bodyBuf.toString('utf8');
    try {
      const obj = JSON.parse(str);
      console.log(JSON.stringify(obj, null, 2));
    } catch (e) {
      console.log(str);
    }
  }
}

/**
 * Pretty-print an HTTP response status and body (minimal skeleton)
 */
function prettyPrintResponse(res, bodyBuf) {
  console.log(chalk.bold.underline('\n=== Response ==='));
  console.log(chalk.bold('Status:'), res.statusCode);

  // Headers
  console.log(chalk.bold('Headers:'));
  for (const [name, val] of Object.entries(res.headers || {})) {
    const value = Array.isArray(val) ? val.join(', ') : val;
    let display = value;
    const lower = name.toLowerCase();
    if (lower === 'authorization') {
      const parts = String(value).split(' ');
      if (parts.length > 1) {
        const scheme = parts.shift();
        const token = parts.join(' ');
        display = `${scheme} ${maskToken(token)}`;
      } else {
        display = maskToken(value);
      }
    } else if (lower === 'x-user-auth') {
      display = maskToken(value);
    }
    console.log(`  ${name}: ${display}`);
  }

  // Body
  if (bodyBuf && bodyBuf.length) {
    console.log(chalk.bold('Body:'));
    const str = bodyBuf.toString('utf8');
    try {
      const obj = JSON.parse(str);
      console.log(JSON.stringify(obj, null, 2));
    } catch {
      console.log(str);
    }
  }
}


// Basic HTTP proxy server
const server = http.createServer((clientReq, clientRes) => {
  // Buffer incoming request body
  const reqChunks = [];
  clientReq.on('data', chunk => reqChunks.push(chunk));
  clientReq.on('end', () => {
    const requestBody = Buffer.concat(reqChunks);
    // Log the request (expand later)
    prettyPrintRequest(clientReq, requestBody);

    // Build upstream URL
    const upstreamUrl = new URL(clientReq.url, baseUrl);
    // Prepare headers for upstream (override Host header)
    const headers = {
      ...clientReq.headers,
      host: upstreamUrl.host
    };
    // Determine port (default to 443 for https, 80 for http)
    const port = upstreamUrl.port
      ? Number(upstreamUrl.port)
      : (upstreamUrl.protocol === 'https:' ? 443 : 80);
    const options = {
      protocol: upstreamUrl.protocol,
      hostname: upstreamUrl.hostname,
      port,
      path: upstreamUrl.pathname + upstreamUrl.search,
      method: clientReq.method,
      headers,
      // Ensure TLS SNI and cert validation use the correct hostname
      servername: upstreamUrl.hostname,
    };

    // Forward to upstream
    const proxyReq = (upstreamUrl.protocol === 'https:' ? https : http)
      .request(options, proxyRes => {
        const resChunks = [];
        proxyRes.on('data', chunk => resChunks.push(chunk));
        proxyRes.on('end', () => {
          const responseBody = Buffer.concat(resChunks);
          // Log the response (expand later)
          prettyPrintResponse(proxyRes, responseBody);

          // Relay status, headers, and body back to client
          clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
          clientRes.end(responseBody);
        });
    });

    proxyReq.on('error', err => {
      console.error(chalk.red('Upstream error:'), err.message);
      // Respond with 502 Bad Gateway on error
      clientRes.writeHead(502);
      clientRes.end('Bad Gateway: ' + err.message);
    });

    // Send buffered request body
    if (requestBody.length) {
      proxyReq.write(requestBody);
    }
    proxyReq.end();
  });
});

// Start listening
server.listen(PORT, () => {
  console.log(chalk.green(
    `Proxy listening on http://localhost:${PORT} → ${baseUrl}`
  ));
  // TODO: initialize CLI UI (Ink/React) here
});