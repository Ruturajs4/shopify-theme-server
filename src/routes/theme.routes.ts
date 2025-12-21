import { Router, Request, Response } from 'express';
import axios from 'axios';
import logger from '../utils/logger';
import { config } from '../config/environment';
import { ShopifyService } from '../services/shopify.service';
import {
  ThemeDownloadRequest,
  StandardAPIResponse,
  ThemeListWebhookPayload,
  ThemeDownloadWebhookPayload
} from '../types/theme.types';

const router = Router();

async function fetchAndSendThemes(): Promise<void> {
  const shopifyService = new ShopifyService();

  try {
    const themes = await shopifyService.listThemes();

    const payload: ThemeListWebhookPayload = {
      success: true,
      themes
    };

    await axios.post(config.WEBHOOK_URL, payload, { timeout: 10000 });
    logger.info(`Sent ${themes.length} themes to webhook`);

  } catch (error: any) {
    logger.error(`Error fetching themes: ${error.message}`);

    const errorPayload: ThemeListWebhookPayload = {
      success: false,
      themes: [],
      error: error.message
    };

    try {
      await axios.post(config.WEBHOOK_URL, errorPayload, { timeout: 10000 });
    } catch (webhookError: any) {
      logger.error(`Webhook error: ${webhookError.message}`);
    }
  }
}

async function fetchAndDownloadTheme(themeId: string): Promise<void> {
  const shopifyService = new ShopifyService();

  try {
    const newThemeId = await shopifyService.downloadTheme(themeId);

    const payload: ThemeDownloadWebhookPayload = {
      success: true,
      theme_id: newThemeId
    };

    await axios.post(config.WEBHOOK_URL, payload, { timeout: 10000 });
    logger.info(`Theme ${newThemeId} started successfully.`);

  } catch (error: any) {
    logger.error(`Error downloading theme: ${error.message}`);

    const errorPayload: ThemeDownloadWebhookPayload = {
      success: false,
      error: error.message
    };

    try {
      await axios.post(config.WEBHOOK_URL, errorPayload, { timeout: 10000 });
    } catch (webhookError: any) {
      logger.error(`Webhook error: ${webhookError.message}`);
    }
  }
}

router.get('/themes/list', (_req: Request, res: Response) => {
  logger.info(`List themes request for ${config.SHOPIFY_STORE_URL}`);

  // Trigger background task
  fetchAndSendThemes();

  const response: StandardAPIResponse = {
    success: true,
    message: 'Theme list request accepted. Results will be sent to webhook.'
  };

  res.json(response);
});

router.post('/themes/download', (req: Request, res: Response) => {
  const request: ThemeDownloadRequest = req.body;

  logger.info(`Download theme ${request.theme_id} from ${config.SHOPIFY_STORE_URL}`);

  // Trigger background task (don't await)
  fetchAndDownloadTheme(request.theme_id);

  const response: StandardAPIResponse = {
    success: true,
    message: `Theme download request for ${request.theme_id} accepted. Results will be sent to webhook.`
  };

  res.json(response);
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

export default router;
