import dotenv from 'dotenv';

dotenv.config();

interface Config {
  THEME_DOWNLOAD_PATH: string;
  PORT: number;
  STORE_NAME: string;
  STORE_PASSWORD: string;
  WEBHOOK_URL: string;
}

function validateEnvironment(): Config {
  const themeDownloadPath = process.env.THEME_DOWNLOAD_PATH;
  const storeName = process.env.STORE_NAME;
  const storePassword = process.env.STORE_PASSWORD;
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!themeDownloadPath) {
    throw new Error('THEME_DOWNLOAD_PATH environment variable is required');
  }

  if (!storeName) {
    throw new Error('STORE_NAME environment variable is required');
  }

  if (!storePassword) {
    throw new Error('STORE_PASSWORD environment variable is required');
  }

  if (!webhookUrl) {
    throw new Error('WEBHOOK_URL environment variable is required');
  }

  return {
    THEME_DOWNLOAD_PATH: themeDownloadPath,
    PORT: parseInt(process.env.PORT || '8000', 10),
    STORE_NAME: storeName,
    STORE_PASSWORD: storePassword,
    WEBHOOK_URL: webhookUrl
  };
}

export const config = validateEnvironment();
