import dotenv from 'dotenv';

dotenv.config();

interface Config {
  THEME_DOWNLOAD_PATH: string;
  PORT: number;
  SHOPIFY_STORE_URL: string;
  SHOPIFY_THEME_PASSWORD: string;
  SHOPIFY_STORE_PASSWORD: string;
  SESSION_ID: string;
  THEME_PULL_MAX_RETRIES: number;
  THEME_PULL_RETRY_DELAY_SECONDS: number;
  THEME_DUPLICATE_WAIT_SECONDS: number;
  WEBHOOK_USERNAME: string;
  WEBHOOK_PASSWORD: string;
  WEBHOOK_URL: string;
}

function validateEnvironment(): Config {
  const themeDownloadPath = process.env.THEME_DOWNLOAD_PATH || './themes';
  const storeName = process.env.SHOPIFY_STORE_URL;
  const shopifyThemePassword = process.env.SHOPIFY_THEME_PASSWORD;
  const shopifyStorePassword = process.env.SHOPIFY_STORE_PASSWORD;
  const sessionId = process.env.SESSION_ID;
  const webhookUsername = process.env.SERVICE_USERNAME;
  
  const webhookPassword = process.env.SERVICE_PASSWORD;
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!themeDownloadPath) {
    throw new Error('THEME_DOWNLOAD_PATH environment variable is required');
  }

  if (!storeName) {
    throw new Error('SHOPIFY_STORE_URL environment variable is required');
  }

  if (!shopifyThemePassword) {
    throw new Error('SHOPIFY_THEME_PASSWORD environment variable is required');
  }

  if (!shopifyStorePassword) {
    throw new Error('SHOPIFY_STORE_PASSWORD environment variable is required');
  }

  if (!sessionId) {
    throw new Error('SESSION_ID environment variable is required');
  }

  if (!webhookUsername) {
    throw new Error('WEBHOOK_USERNAME environment variable is required');
  }

  if (!webhookPassword) {
    throw new Error('WEBHOOK_PASSWORD environment variable is required');
  }

  if (!webhookUrl) {
    throw new Error('WEBHOOK_URL environment variable is required');
  }

  return {
    THEME_DOWNLOAD_PATH: themeDownloadPath || './themes',
    PORT: parseInt(process.env.PORT || '8000', 10),
    SHOPIFY_STORE_URL: storeName,
    SHOPIFY_THEME_PASSWORD: shopifyThemePassword,
    SHOPIFY_STORE_PASSWORD: shopifyStorePassword,
    SESSION_ID: sessionId,
    THEME_PULL_MAX_RETRIES:  3,
    THEME_PULL_RETRY_DELAY_SECONDS:  10,
    THEME_DUPLICATE_WAIT_SECONDS: 10,
    WEBHOOK_USERNAME: webhookUsername,
    WEBHOOK_PASSWORD: webhookPassword,
    WEBHOOK_URL: webhookUrl
  };
}

export const config = validateEnvironment();
