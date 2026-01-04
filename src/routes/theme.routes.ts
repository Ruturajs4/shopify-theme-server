import { Router, Request, Response } from 'express';
import axios from 'axios';
import logger from '../utils/logger';
import { config } from '../config/environment';
import { ShopifyService } from '../services/shopify.service';
import { BasicAuthService } from '../services/auth.service';
import {
  ThemeDownloadRequest,
  StandardAPIResponse,
  ThemeDownloadWebhookPayload
} from '../types/theme.types';

const router = Router();
const authService = new BasicAuthService();

async function fetchAndDownloadTheme(themeId: string): Promise<void> {
  const shopifyService = new ShopifyService();

  try {
    const { themeId: newThemeId, envId } = await shopifyService.downloadTheme(themeId);

    const payload: ThemeDownloadWebhookPayload = {
      success: true,
      theme_id: newThemeId,
      env_id: envId
    };

    const fullWebhookUrl = `${config.WEBHOOK_URL}/theme/${config.SESSION_ID}`;
    await axios.post(fullWebhookUrl, payload, {
      timeout: 10000,
      headers: authService.getAuthHeaders()
    });
    logger.info(`Theme ${newThemeId} started successfully.`);

  } catch (error: any) {
    logger.error(`Error downloading theme: ${error.message}`);

    const errorPayload: ThemeDownloadWebhookPayload = {
      success: false,
      error: error.message
    };

    try {
      const fullWebhookUrl = `${config.WEBHOOK_URL}/theme/${config.SESSION_ID}`;
      await axios.post(fullWebhookUrl, errorPayload, {
        timeout: 10000,
        headers: authService.getAuthHeaders()
      });
    } catch (webhookError: any) {
      logger.error(`Webhook error: ${webhookError.message}`);
    }
  }
}

router.post('/selected-theme', (req: Request, res: Response) => {
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
