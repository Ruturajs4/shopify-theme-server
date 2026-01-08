import express from 'express';
import axios from 'axios';
import logger from './utils/logger';
import { Agent } from 'http';

const app = express();
const PROXY_PORT = 3005;
const SHOPIFY_DEV_PORT = 9292; // Default Shopify theme dev port

// Create HTTP agent with keep-alive for better connection handling
const httpAgent = new Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
});

// Middleware to handle all requests
app.use('*', async (req, res) => {
  try {
    const targetUrl = `http://127.0.0.1:${SHOPIFY_DEV_PORT}${req.originalUrl}`;

    logger.info(`Proxying request: ${req.method} ${req.originalUrl}`);

    // Forward the request to Shopify dev server
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${SHOPIFY_DEV_PORT}`,
      },
      data: req.body,
      responseType: 'arraybuffer',
      validateStatus: () => true, // Accept all status codes
      maxRedirects: 0, // Don't follow redirects automatically
      timeout: 30000, // 30 second timeout
      httpAgent: httpAgent,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Remove headers that prevent iframe embedding
    const headersToRemove = [
      'x-frame-options',
      'content-security-policy',
      'x-content-security-policy',
    ];

    // Copy all headers except the ones we want to remove
    Object.entries(response.headers).forEach(([key, value]) => {
      if (!headersToRemove.includes(key.toLowerCase())) {
        res.setHeader(key, value as string);
      }
    });

    // Set permissive headers for iframe embedding
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.removeHeader('Content-Security-Policy');

    // Send the response
    res.status(response.status).send(response.data);
  } catch (error: any) {
    logger.error(`Proxy error: ${error.message}`);

    if (error.code === 'ECONNREFUSED') {
      res.status(503).send('Shopify dev server is not running on port ' + SHOPIFY_DEV_PORT);
    } else if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
      res.status(502).send('Connection to Shopify dev server was reset');
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      res.status(504).send('Request to Shopify dev server timed out');
    } else {
      res.status(500).send('Proxy error: ' + error.message);
    }
  }
});

// Start the proxy server
app.listen(PROXY_PORT, () => {
  logger.info(`Proxy server running on port ${PROXY_PORT}`);
  logger.info(`Forwarding requests to Shopify dev server on port ${SHOPIFY_DEV_PORT}`);
  logger.info(`Access your theme through: http://localhost:${PROXY_PORT}`);
});

export default app;
