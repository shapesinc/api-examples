import net from 'net';
import { URL } from 'node:url';

/**
 * Check if a TCP port is accepting connections.
 * @param {string} host hostname or IP (default: 127.0.0.1)
 * @param {number} port TCP port to check
 * @param {number} timeoutMs timeout in milliseconds
 * @returns {Promise<boolean>} true if open, false otherwise
 */
export function isTcpPortOpen(host = '127.0.0.1', port = 8090, timeoutMs = 200) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    let done = false;
    function onResult(open) {
      if (!done) {
        done = true;
        socket.destroy();
        resolve(open);
      }
    }
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => onResult(true));
    socket.once('timeout', () => onResult(false));
    socket.once('error', () => onResult(false));
    socket.connect(port, host);
  });
}

/**
 * @param {object} opts
 * @param {string} [opts.prodUrl]
 * @param {string} [opts.devUrl]
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<string>}
 */
export async function getApiBaseUrl({
  devUrl = 'http://localhost:8080/v1',
  prodUrl  = 'https://api.shapes.inc/v1',
  timeoutMs = 200
} = {}) {
  try {
    const devHost = new URL(devUrl)
    const isDevUp = await isTcpPortOpen(devHost.hostname, Number(devHost.port) || (devHost.protocol === 'https:' ? 443 : 80), timeoutMs)
    return isDevUp ? devUrl : prodUrl
  } catch (err) {
    return prodUrl;
  }
}