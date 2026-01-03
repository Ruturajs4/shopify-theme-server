/**
 * Example: Testing Background Execution
 *
 * This demonstrates that /chat and /chat-streaming run in the background
 * and don't block the server.
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

/**
 * Test that requests return immediately while processing in background
 */
async function testBackgroundExecution() {
  console.log('='.repeat(70));
  console.log('Background Execution Test');
  console.log('='.repeat(70));
  console.log();

  const envId = 'themes_123456789'; // Replace with actual env ID

  console.log('Testing /chat endpoint...');
  console.log('-'.repeat(70));

  // Track timing
  const startTime = Date.now();

  try {
    // Send chat request
    const response = await axios.post(`${BASE_URL}/chat`, {
      env_id: envId,
      prompt: 'This is a test prompt that will take some time to process'
    });

    const responseTime = Date.now() - startTime;

    console.log('✓ Response received');
    console.log(`  Response time: ${responseTime}ms`);
    console.log(`  Message: ${response.data.message}`);
    console.log();

    if (responseTime < 1000) {
      console.log('✓ PASSED: Response returned immediately (< 1 second)');
      console.log('  This confirms the request is running in the background!');
    } else {
      console.log('⚠️  WARNING: Response took longer than expected');
      console.log('  The request might not be running in the background properly');
    }
    console.log();

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Test multiple concurrent requests
 */
async function testConcurrentRequests() {
  console.log('='.repeat(70));
  console.log('Concurrent Requests Test');
  console.log('='.repeat(70));
  console.log();

  const envId = 'themes_123456789';

  console.log('Sending 3 chat requests concurrently...');
  console.log('-'.repeat(70));

  const startTime = Date.now();

  try {
    // Send 3 requests at the same time
    const promises = [
      axios.post(`${BASE_URL}/chat`, {
        env_id: envId,
        prompt: 'Request 1: Count files'
      }),
      axios.post(`${BASE_URL}/chat`, {
        env_id: envId,
        prompt: 'Request 2: List templates'
      }),
      axios.post(`${BASE_URL}/chat`, {
        env_id: envId,
        prompt: 'Request 3: Analyze structure'
      })
    ];

    // Wait for all responses
    const responses = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    console.log('✓ All responses received');
    console.log(`  Total time: ${totalTime}ms`);
    console.log(`  Average time per request: ${Math.round(totalTime / 3)}ms`);
    console.log();

    if (totalTime < 2000) {
      console.log('✓ PASSED: All requests returned quickly');
      console.log('  This confirms requests run in the background without blocking!');
    } else {
      console.log('⚠️  WARNING: Requests took longer than expected');
    }
    console.log();

    responses.forEach((response, index) => {
      console.log(`Request ${index + 1}: ${response.data.message}`);
    });
    console.log();

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Test streaming endpoint background execution
 */
async function testStreamingBackground() {
  console.log('='.repeat(70));
  console.log('Streaming Background Execution Test');
  console.log('='.repeat(70));
  console.log();

  const envId = 'themes_123456789';

  console.log('Testing /chat-streaming endpoint...');
  console.log('-'.repeat(70));

  const startTime = Date.now();

  try {
    const response = await axios.post(`${BASE_URL}/chat-streaming`, {
      env_id: envId,
      prompt: 'This is a long-running streaming test'
    });

    const responseTime = Date.now() - startTime;

    console.log('✓ Response received');
    console.log(`  Response time: ${responseTime}ms`);
    console.log(`  Message: ${response.data.message}`);
    console.log();

    if (responseTime < 1000) {
      console.log('✓ PASSED: Streaming response returned immediately');
      console.log('  Background processing is working correctly!');
    } else {
      console.log('⚠️  WARNING: Response took longer than expected');
    }
    console.log();

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Visual demonstration of background processing
 */
async function visualDemo() {
  console.log('='.repeat(70));
  console.log('Visual Background Processing Demo');
  console.log('='.repeat(70));
  console.log();

  const envId = 'themes_123456789';

  console.log('Timeline:');
  console.log();

  try {
    console.log('00:00.000 - Sending chat request...');
    const startTime = Date.now();

    const response = await axios.post(`${BASE_URL}/chat`, {
      env_id: envId,
      prompt: 'Add a newsletter section'
    });

    const endTime = Date.now();
    const elapsed = endTime - startTime;

    console.log(`00:00.${elapsed.toString().padStart(3, '0')} - ✓ Response received`);
    console.log(`           Server accepted request immediately`);
    console.log();
    console.log('           [Background Task Running...]');
    console.log('           - Codex processing prompt');
    console.log('           - Editing theme files');
    console.log('           - Preparing webhook');
    console.log();
    console.log('00:0X.XXX - Webhook notification sent');
    console.log('           (Actual time depends on Codex processing)');
    console.log();

    console.log('Summary:');
    console.log(`  Server response: ${elapsed}ms`);
    console.log(`  Background task: Still running`);
    console.log(`  Webhook: Will be sent when complete`);
    console.log();

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log();
  console.log('═'.repeat(70));
  console.log('BACKGROUND EXECUTION TESTS');
  console.log('═'.repeat(70));
  console.log();
  console.log('These tests verify that /chat and /chat-streaming endpoints');
  console.log('run in the background without blocking the server.');
  console.log();
  console.log('Expected behavior:');
  console.log('  ✓ Requests should return in < 1 second');
  console.log('  ✓ Multiple requests should not block each other');
  console.log('  ✓ Server remains responsive during processing');
  console.log();
  console.log('Note: Ensure server is running and environment exists');
  console.log();

  // Uncomment to run tests:
  // await testBackgroundExecution();
  // await testConcurrentRequests();
  // await testStreamingBackground();
  // await visualDemo();

  console.log('═'.repeat(70));
  console.log('Tests complete! Uncomment tests above to run them.');
  console.log('═'.repeat(70));
  console.log();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  testBackgroundExecution,
  testConcurrentRequests,
  testStreamingBackground,
  visualDemo
};
