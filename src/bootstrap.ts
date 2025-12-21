import { WebhookService } from './services/webhook.service';
import logger from './utils/logger';

async function bootstrap() {
  logger.info('Starting bootstrap: Fetching and sending theme list to webhook...');

  const webhookService = new WebhookService();
  await webhookService.sendThemeList();

  logger.info('Bootstrap completed');
}

bootstrap().catch((error) => {
  logger.error(`Bootstrap failed: ${error.message}`);
  process.exit(1);
});
