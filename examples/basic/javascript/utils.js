import net from 'net'
import { URL } from 'node:url'

/**
 * Check if a TCP port is accepting connections.
 * @param {string} host
 * @param {number} port
 * @param {number} timeoutMs
 * @returns {Promise<boolean>}
 */
function isTcpPortOpen(host = '127.0.0.1', port = 8090, timeoutMs = 200) {
    return new Promise(resolve => {
        const sock = new net.Socket()
        let settled = false
        const onDone = up => {
            if (!settled) {
                settled = true
                sock.destroy()
                resolve(up)
            }
        }
        sock.setTimeout(timeoutMs)
        sock.once('connect', () => onDone(true))
        sock.once('timeout', () => onDone(false))
        sock.once('error', () => onDone(false))
        sock.connect(port, host)
    })
}

/**
 * @param {object} [opts]
 * @param {string} [opts.prodUrl]
 * @param {string} [opts.devUrl]
 * @param {string} [opts.debugUrl]
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<string>}
 */
export async function getApiBaseUrl({
    prodUrl = 'https://api.shapes.inc/v1',
    devUrl = 'http://localhost:8080/v1',
    debugUrl = 'http://localhost:8090/v1',
    timeoutMs = 200
} = {}) {
    try {
        const debugHost = new URL(debugUrl)
        const isDebugUp = await isTcpPortOpen(debugHost.hostname, Number(debugHost.port) || (debugHost.protocol === 'https:' ? 443 : 80), timeoutMs)
        const devHost = new URL(devUrl)
        const isDevUp = await isTcpPortOpen(devHost.hostname, Number(devHost.port) || (devHost.protocol === 'https:' ? 443 : 80), timeoutMs)
        return isDebugUp ? debugUrl : isDevUp ? devUrl : prodUrl
    } catch (err) {
        return prodUrl;
    }
}
