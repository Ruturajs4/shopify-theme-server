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
  const themeDownloadPath = process.env.THEME_DOWNLOAD_PATH;
  const storeName = process.env.SHOPIFY_STORE_URL;
  const shopifyThemePassword = process.env.SHOPIFY_THEME_PASSWORD;
  const shopifyStorePassword = process.env.SHOPIFY_STORE_PASSWORD;
  const sessionId = process.env.SESSION_ID;
  const themePullMaxRetries = process.env.THEME_PULL_MAX_RETRIES;
  const themePullRetryDelaySeconds = process.env.THEME_PULL_RETRY_DELAY_SECONDS;
  const themeDuplicateWaitSeconds = process.env.THEME_DUPLICATE_WAIT_SECONDS;
  const webhookUsername = process.env.WEBHOOK_USERNAME;
  const webhookPassword = process.env.WEBHOOK_PASSWORD;
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

  if (!themePullMaxRetries) {
    throw new Error('THEME_PULL_MAX_RETRIES environment variable is required');
  }

  if (!themePullRetryDelaySeconds) {
    throw new Error('THEME_PULL_RETRY_DELAY_SECONDS environment variable is required');
  }

  if (!themeDuplicateWaitSeconds) {
    throw new Error('THEME_DUPLICATE_WAIT_SECONDS environment variable is required');
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
    THEME_DOWNLOAD_PATH: themeDownloadPath,
    PORT: parseInt(process.env.PORT || '8000', 10),
    SHOPIFY_STORE_URL: storeName,
    SHOPIFY_THEME_PASSWORD: shopifyThemePassword,
    SHOPIFY_STORE_PASSWORD: shopifyStorePassword,
    SESSION_ID: sessionId,
    THEME_PULL_MAX_RETRIES: parseInt(themePullMaxRetries, 10),
    THEME_PULL_RETRY_DELAY_SECONDS: parseInt(themePullRetryDelaySeconds, 10),
    THEME_DUPLICATE_WAIT_SECONDS: parseInt(themeDuplicateWaitSeconds, 10),
    WEBHOOK_USERNAME: webhookUsername,
    WEBHOOK_PASSWORD: webhookPassword,
    WEBHOOK_URL: webhookUrl
  };
}

export const config = validateEnvironment();
