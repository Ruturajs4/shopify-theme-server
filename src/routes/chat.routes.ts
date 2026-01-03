/**
 * Chat Routes
 *
 * Endpoints for chatting with Codex environments
 * Sends webhook notifications on completion
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import logger from '../utils/logger';
import { config } from '../config/environment';
import { BasicAuthService } from '../services/auth.service';
import codexService from '../services/codex.instance';
import {
  ChatRequest,
  ChatStreamingRequest,
  ChatWebhookPayload,
  ChatStreamingWebhookPayload,
  StandardAPIResponse
} from '../types/theme.types';

const router = Router();
const authService = new BasicAuthService();

/**
 * Background function to handle chat and send webhook notification
 */
async function handleChat(envId: string, prompt: string, model?: string): Promise<void> {
  try {
    logger.info('Starting chat', { envId, prompt: prompt.substring(0, 50) });

    // Get the environment
    const environment = codexService.getEnvironment(envId);

    if (!environment) {
      throw new Error(`Environment not found: ${envId}`);
    }

    // Run the prompt
    const turn = await codexService.run(environment.thread, prompt, { model });

    // Prepare success payload
    const payload: ChatWebhookPayload = {
      success: true,
      env_id: envId,
      response: turn.finalResponse,
      items: turn.items,
    };

    // Send webhook notification
    const webhookUrl = `${config.WEBHOOK_URL}/chat/${config.SESSION_ID}`;
    await axios.post(webhookUrl, payload, {
      timeout: 10000,
      headers: authService.getAuthHeaders()
    });

    logger.info('Chat completed and webhook sent', { envId });

  } catch (error: any) {
    logger.error('Error in chat', { error: error.message, envId });

    // Prepare error payload
    const errorPayload: ChatWebhookPayload = {
      success: false,
      env_id: envId,
      error: error.message
    };

    // Try to send error webhook
    try {
      const webhookUrl = `${config.WEBHOOK_URL}/chat/${config.SESSION_ID}`;
      await axios.post(webhookUrl, errorPayload, {
        timeout: 10000,
        headers: authService.getAuthHeaders()
      });
    } catch (webhookError: any) {
      logger.error('Webhook error', { error: webhookError.message });
    }
  }
}

/**
 * Background function to handle streaming chat and send webhook for EACH event
 */
async function handleChatStreaming(envId: string, prompt: string, model?: string): Promise<void> {
  const webhookUrl = `${config.WEBHOOK_URL}/chat-streaming/${config.SESSION_ID}`;

  try {
    logger.info('Starting streaming chat', { envId, prompt: prompt.substring(0, 50) });

    // Get the environment
    const environment = codexService.getEnvironment(envId);

    if (!environment) {
      throw new Error(`Environment not found: ${envId}`);
    }

    // Run the prompt with streaming
    let eventCount = 0;
    const isAgentMessageOrReasoning = (event: any) =>
      event?.item?.type === 'agent_message' || event?.item?.type === 'reasoning';
    const isAllowedNonItemEvent = (event: any) =>
      event?.type === 'thread.started' || event?.type === 'turn.completed';

    const result = await codexService.runStreamWithHandler(
      environment.thread,
      prompt,
      async (event) => {
        if (event?.type?.startsWith('item.')) {
          if (!isAgentMessageOrReasoning(event)) {
            return;
          }
        } else if (!isAllowedNonItemEvent(event)) {
          return;
        }

        eventCount++;

        // Send webhook for EACH event
        try {
          // Spread event properties directly into payload (cleaner, no nesting)
          const eventPayload = {
            success: true,
            env_id: envId,
            event_number: eventCount,
            timestamp: new Date().toISOString(),
            ...event  // Spreads: type, delta, item, usage, etc.
          };

          await axios.post(webhookUrl, eventPayload, {
            timeout: 10000,
            headers: authService.getAuthHeaders()
          });

          logger.debug('Streaming event webhook sent', {
            envId,
            type: event.type,
            eventNumber: eventCount
          });

        } catch (webhookError: any) {
          logger.error('Error sending event webhook', {
            error: webhookError.message,
            eventType: event.type
          });
          // Continue processing even if webhook fails
        }
      },
      { model }
    );

    logger.info('Streaming chat completed', { envId, totalEvents: eventCount });

  } catch (error: any) {
    logger.error('Error in streaming chat', { error: error.message, envId });

    // Send error webhook
    try {
      const errorPayload = {
        success: false,
        env_id: envId,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      await axios.post(webhookUrl, errorPayload, {
        timeout: 10000,
        headers: authService.getAuthHeaders()
      });
    } catch (webhookError: any) {
      logger.error('Webhook error', { error: webhookError.message });
    }
  }
}

/**
 * POST /chat
 * Chat with a Codex environment (non-streaming)
 * Sends result to webhook: {WEBHOOK_URL}/chat/{SESSION_ID}
 */
router.post('/chat', (req: Request, res: Response) => {
  const request: ChatRequest = req.body;

  if (!request.env_id || !request.prompt) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: env_id and prompt'
    });
  }

  logger.info('Chat request received', {
    env_id: request.env_id,
    prompt: request.prompt.substring(0, 50),
    model: request.model
  });

  // Trigger background task (don't await) - wrapped to catch any unhandled errors
  handleChat(request.env_id, request.prompt, request.model).catch((error) => {
    logger.error('Unhandled error in background chat task', { error: error.message });
  });

  const response: StandardAPIResponse = {
    success: true,
    message: `Chat request accepted for environment ${request.env_id}. Results will be sent to webhook.`
  };

  res.json(response);
});

/**
 * POST /chat-streaming
 * Chat with a Codex environment (streaming)
 * Sends result to webhook: {WEBHOOK_URL}/chat-streaming/{SESSION_ID}
 */
router.post('/chat-streaming', (req: Request, res: Response) => {
  const request: ChatStreamingRequest = req.body;

  if (!request.env_id || !request.prompt) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: env_id and prompt'
    });
  }

  logger.info('Streaming chat request received', {
    env_id: request.env_id,
    prompt: request.prompt.substring(0, 50),
    model: request.model
  });

  // Trigger background task (don't await) - wrapped to catch any unhandled errors
  handleChatStreaming(request.env_id, request.prompt, request.model).catch((error) => {
    logger.error('Unhandled error in background streaming chat task', { error: error.message });
  });

  const response: StandardAPIResponse = {
    success: true,
    message: `Streaming chat request accepted for environment ${request.env_id}. Results will be sent to webhook.`
  };

  res.json(response);
});

export default router;
