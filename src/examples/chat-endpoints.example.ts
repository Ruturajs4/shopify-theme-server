/**
 * Example: Using Chat Endpoints
 *
 * Demonstrates how to use /chat and /chat-streaming endpoints
 * that send webhook notifications on completion
 */

import axios from 'axios';
import { config } from '../config/environment';

const BASE_URL = 'http://localhost:8000';

/**
 * Example 1: Using /chat endpoint (non-streaming)
 */
async function chatExample() {
  console.log('='.repeat(70));
  console.log('Example 1: /chat endpoint');
  console.log('='.repeat(70));
  console.log();

  try {
    // Assuming we have an environment ID from a previously downloaded theme
    const envId = 'themes_123456789'; // Replace with actual env ID

    console.log('Sending chat request...');
    console.log(`Environment ID: ${envId}`);
    console.log('Prompt: "Add a newsletter signup section to the footer"');
    console.log();

    const response = await axios.post(`${BASE_URL}/chat`, {
      env_id: envId,
      prompt: 'Add a newsletter signup section to the footer',
      model: 'gpt-5.1-codex-max' // Optional
    });

    console.log('✓ Chat request accepted');
    console.log('Response:', response.data);
    console.log();
    console.log('Webhook will be sent to:');
    console.log(`  ${config.WEBHOOK_URL}/chat/${config.SESSION_ID}`);
    console.log();
    console.log('Expected webhook payload:');
    console.log(`  {
    "success": true,
    "env_id": "${envId}",
    "response": "I've added a newsletter signup section...",
    "items": [...]
  }`);
    console.log();

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

/**
 * Example 2: Using /chat-streaming endpoint
 */
async function chatStreamingExample() {
  console.log('='.repeat(70));
  console.log('Example 2: /chat-streaming endpoint');
  console.log('='.repeat(70));
  console.log();

  try {
    const envId = 'themes_123456789'; // Replace with actual env ID

    console.log('Sending streaming chat request...');
    console.log(`Environment ID: ${envId}`);
    console.log('Prompt: "Analyze the theme structure and suggest improvements"');
    console.log();

    const response = await axios.post(`${BASE_URL}/chat-streaming`, {
      env_id: envId,
      prompt: 'Analyze the theme structure and suggest improvements',
      model: 'gpt-5.1-codex-max' // Optional
    });

    console.log('✓ Streaming chat request accepted');
    console.log('Response:', response.data);
    console.log();
    console.log('Webhook will be sent to:');
    console.log(`  ${config.WEBHOOK_URL}/chat-streaming/${config.SESSION_ID}`);
    console.log();
    console.log('Expected webhook payload:');
    console.log(`  {
    "success": true,
    "env_id": "${envId}",
    "events_count": 42,
    "final_response": "Based on my analysis..."
  }`);
    console.log();

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

/**
 * Example 3: Error handling - Invalid environment
 */
async function errorHandlingExample() {
  console.log('='.repeat(70));
  console.log('Example 3: Error handling');
  console.log('='.repeat(70));
  console.log();

  try {
    console.log('Sending request with invalid env_id...');

    const response = await axios.post(`${BASE_URL}/chat`, {
      env_id: 'invalid_env_id',
      prompt: 'Test prompt'
    });

    console.log('✓ Request accepted (will fail in background)');
    console.log('Response:', response.data);
    console.log();
    console.log('Error webhook will be sent to:');
    console.log(`  ${config.WEBHOOK_URL}/chat/${config.SESSION_ID}`);
    console.log();
    console.log('Expected error webhook payload:');
    console.log(`  {
    "success": false,
    "env_id": "invalid_env_id",
    "error": "Environment not found: invalid_env_id"
  }`);
    console.log();

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Example 4: Complete workflow
 */
async function completeWorkflowExample() {
  console.log('='.repeat(70));
  console.log('Example 4: Complete workflow');
  console.log('='.repeat(70));
  console.log();

  try {
    // Step 1: List available environments
    console.log('Step 1: List available environments');
    console.log('-'.repeat(70));

    const envResponse = await axios.get(`${BASE_URL}/api/codex/environments`);
    console.log('Environments:', envResponse.data);
    console.log();

    if (envResponse.data.environments.length === 0) {
      console.log('⚠️  No environments found. Download a theme first.');
      return;
    }

    const envId = envResponse.data.environments[0].envId;
    console.log(`Using environment: ${envId}`);
    console.log();

    // Step 2: Send chat request
    console.log('Step 2: Send chat request');
    console.log('-'.repeat(70));

    const chatResponse = await axios.post(`${BASE_URL}/chat`, {
      env_id: envId,
      prompt: 'List all liquid template files in the theme'
    });

    console.log('✓ Chat request sent');
    console.log('Response:', chatResponse.data);
    console.log();

    // Step 3: Wait for webhook (in production, webhook receiver handles this)
    console.log('Step 3: Webhook notification');
    console.log('-'.repeat(70));
    console.log('Webhook will be sent to:');
    console.log(`  ${config.WEBHOOK_URL}/chat/${config.SESSION_ID}`);
    console.log();
    console.log('Your webhook endpoint should:');
    console.log('  1. Receive POST request');
    console.log('  2. Parse JSON payload');
    console.log('  3. Check payload.success');
    console.log('  4. Process payload.response or handle payload.error');
    console.log();

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

/**
 * Example 5: Webhook receiver implementation (example)
 */
function webhookReceiverExample() {
  console.log('='.repeat(70));
  console.log('Example 5: Webhook receiver implementation');
  console.log('='.repeat(70));
  console.log();

  console.log('Example webhook receiver (Express):');
  console.log();
  console.log(`
import express from 'express';

const app = express();
app.use(express.json());

// Webhook endpoint for /chat
app.post('/chat/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const payload = req.body;

  console.log('Chat webhook received:', sessionId);

  if (payload.success) {
    console.log('Environment:', payload.env_id);
    console.log('Response:', payload.response);
    console.log('Items:', payload.items);

    // Process the response
    // e.g., save to database, send to client, etc.
  } else {
    console.error('Chat failed:', payload.error);

    // Handle error
    // e.g., notify user, retry, etc.
  }

  res.json({ received: true });
});

// Webhook endpoint for /chat-streaming
app.post('/chat-streaming/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const payload = req.body;

  console.log('Streaming chat webhook received:', sessionId);

  if (payload.success) {
    console.log('Environment:', payload.env_id);
    console.log('Events count:', payload.events_count);
    console.log('Final response:', payload.final_response);

    // Process the response
  } else {
    console.error('Streaming chat failed:', payload.error);

    // Handle error
  }

  res.json({ received: true });
});

app.listen(3000);
  `);
  console.log();
}

/**
 * Example 6: Using with different models
 */
async function differentModelsExample() {
  console.log('='.repeat(70));
  console.log('Example 6: Using different models');
  console.log('='.repeat(70));
  console.log();

  const envId = 'themes_123456789';

  console.log('Using gpt-5-codex-mini for quick tasks:');
  const quickResponse = await axios.post(`${BASE_URL}/chat`, {
    env_id: envId,
    prompt: 'Count the number of sections in the theme',
    model: 'gpt-5-codex-mini'
  });
  console.log('✓', quickResponse.data.message);
  console.log();

  console.log('Using gpt-5.1-codex-max for complex tasks:');
  const complexResponse = await axios.post(`${BASE_URL}/chat`, {
    env_id: envId,
    prompt: 'Refactor the theme to improve performance and SEO',
    model: 'gpt-5.1-codex-max'
  });
  console.log('✓', complexResponse.data.message);
  console.log();
}

/**
 * Main function
 */
async function main() {
  console.log();
  console.log('═'.repeat(70));
  console.log('CHAT ENDPOINTS EXAMPLES');
  console.log('═'.repeat(70));
  console.log();

  console.log('Note: These examples assume:');
  console.log('  1. Server is running on http://localhost:8000');
  console.log('  2. At least one theme environment exists');
  console.log('  3. WEBHOOK_URL and SESSION_ID are configured');
  console.log();
  console.log('Press Ctrl+C to exit, or uncomment examples below to run.');
  console.log();

  // Uncomment to run examples:
  // await chatExample();
  // await chatStreamingExample();
  // await errorHandlingExample();
  // await completeWorkflowExample();
  // webhookReceiverExample();
  // await differentModelsExample();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  chatExample,
  chatStreamingExample,
  errorHandlingExample,
  completeWorkflowExample,
  webhookReceiverExample,
  differentModelsExample
};
