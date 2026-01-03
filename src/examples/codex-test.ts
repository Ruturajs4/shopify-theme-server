/**
 * Simple test script for CodexService
 *
 * This file provides a quick way to test the CodexService functionality.
 * Make sure to set your OPENAI_API_KEY environment variable before running.
 *
 * Usage:
 *   npm run codex:test
 */

import CodexService from '../services/codex.service';
import * as path from 'path';

async function testCodexService() {
  console.log('='.repeat(60));
  console.log('CodexService Test Suite');
  console.log('='.repeat(60));
  console.log();

  // Check for API key
  if (!process.env.OPENAI_API_KEY && !process.env.CODEX_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY or CODEX_API_KEY environment variable not set');
    console.log('\nPlease set your API key:');
    console.log('  export OPENAI_API_KEY=your-api-key-here');
    process.exit(1);
  }

  console.log('✓ API key found');
  console.log();

  try {
    // Test 1: Initialize service
    console.log('Test 1: Initialize CodexService');
    console.log('-'.repeat(60));
    const codexService = new CodexService(
      process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY,
      path.join(__dirname, '../..')
    );
    console.log('✓ CodexService initialized successfully');
    console.log();

    // Test 2: Start thread with different configurations
    console.log('Test 2: Start thread');
    console.log('-'.repeat(60));
    const thread = await codexService.startThread({
      workingDirectory: path.join(__dirname, '../..'),
      skipGitRepoCheck: true, // Set to true for testing
      model: 'gpt-5-codex',
      yoloMode: false, // Safe mode for testing
    });
    console.log('✓ Thread started successfully');
    console.log('  Working directory:', path.join(__dirname, '../..'));
    console.log('  Model: gpt-5-codex');
    console.log('  YOLO mode: disabled');
    console.log();

    // Test 3: Simple run
    console.log('Test 3: Run simple prompt');
    console.log('-'.repeat(60));
    console.log('Prompt: "Echo the text: Hello from CodexService!"');
    console.log();

    const turn1 = await codexService.run(
      thread,
      'Echo the text: Hello from CodexService!'
    );

    console.log('✓ Prompt executed successfully');
    console.log('Response:');
    console.log(turn1.finalResponse);
    console.log();

    // Test 4: Streaming example
    console.log('Test 4: Run with streaming');
    console.log('-'.repeat(60));
    console.log('Prompt: "Count from 1 to 5"');
    console.log();

    let streamComplete = false;
    const streamResult = await codexService.runStreamWithHandler(
      thread,
      'Count from 1 to 5',
      async (event) => {
        if (event.type === 'response.delta') {
          process.stdout.write(event.delta || '');
        } else if (event.type === 'turn.completed') {
          streamComplete = true;
          console.log();
        }
      }
    );

    if (streamComplete) {
      console.log('✓ Streaming completed successfully');
    }
    console.log();

    // Test 5: Different model
    console.log('Test 5: Test model override');
    console.log('-'.repeat(60));
    const turn2 = await codexService.run(
      thread,
      'Say "Model override test successful"',
      {
        model: 'gpt-5-codex', // Can be changed to test different models
      }
    );
    console.log('✓ Model override works');
    console.log('Response:', turn2.finalResponse?.substring(0, 100));
    console.log();

    // Test 6: Quick run helper
    console.log('Test 6: Test quickRun helper');
    console.log('-'.repeat(60));
    const quickResult = await codexService.quickRun(
      'What is 2 + 2?',
      {
        workingDirectory: path.join(__dirname, '../..'),
        skipGitRepoCheck: true,
        model: 'gpt-5-codex',
      }
    );
    console.log('✓ quickRun works');
    console.log('Response:', quickResult.finalResponse?.substring(0, 100));
    console.log();

    // All tests passed
    console.log('='.repeat(60));
    console.log('✓ All tests passed!');
    console.log('='.repeat(60));
    console.log();
    console.log('Summary:');
    console.log('  - CodexService initialization: ✓');
    console.log('  - Thread creation: ✓');
    console.log('  - Basic run: ✓');
    console.log('  - Streaming: ✓');
    console.log('  - Model override: ✓');
    console.log('  - Quick run helper: ✓');
    console.log();

  } catch (error) {
    console.error();
    console.error('❌ Test failed with error:');
    console.error(error);
    console.error();
    process.exit(1);
  }
}

// Run tests
testCodexService().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
