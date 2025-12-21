import axios from 'axios';
import logger from '../utils/logger';
import { config } from '../config/environment';
import { ShopifyService } from './shopify.service';
import { BasicAuthService } from './auth.service';
import { ThemeListWebhookPayload } from '../types/theme.types';

export class WebhookService {
  private readonly shopifyService: ShopifyService;
  private readonly authService: BasicAuthService;

  constructor() {
    this.shopifyService = new ShopifyService();
    this.authService = new BasicAuthService();
  }

  async sendThemeList(): Promise<void> {
    try {
      const themes = await this.shopifyService.listThemes();

      const payload: ThemeListWebhookPayload = {
        success: true,
        themes
      };

      const fullWebhookUrl = `${config.WEBHOOK_URL}/theme/${config.SESSION_ID}`;
      await axios.post(fullWebhookUrl, payload, {
        timeout: 10000,
        headers: this.authService.getAuthHeaders()
      });
      logger.info(`Sent ${themes.length} themes to webhook`);

    } catch (error: any) {
      logger.error(`Error fetching themes: ${error.message}`);

      const errorPayload: ThemeListWebhookPayload = {
        success: false,
        themes: [],
        error: error.message
      };

      try {
        const fullWebhookUrl = `${config.WEBHOOK_URL}/theme/${config.SESSION_ID}`;
        await axios.post(fullWebhookUrl, errorPayload, {
          timeout: 10000,
          headers: this.authService.getAuthHeaders()
        });
      } catch (webhookError: any) {
        logger.error(`Webhook error: ${webhookError.message}`);
      }
    }
  }
}
