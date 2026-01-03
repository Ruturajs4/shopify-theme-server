/**
 * Example usage of CodexService
 *
 * This file demonstrates how to use the CodexService class
 * to interact with OpenAI Codex in various ways.
 */

import CodexService from '../services/codex.service';
import logger from '../utils/logger';

/**
 * Example 1: Basic usage with run()
 */
async function basicExample() {
  console.log('\n=== Example 1: Basic Usage ===\n');

  const codexService = new CodexService();

  // Create a thread with working directory and skipGitRepoCheck
  const thread = await codexService.startThread({
    workingDirectory: process.cwd(),
    skipGitRepoCheck: false, // Set to false to require Git repo
    model: 'gpt-5-codex', // Use different model
  });

  // Run a simple prompt
  const turn = await codexService.run(
    thread,
    'List all TypeScript files in the src directory'
  );

  console.log('Response:', turn.finalResponse);
  console.log('Items:', turn.items);
}

/**
 * Example 2: Using different models
 */
async function differentModelExample() {
  console.log('\n=== Example 2: Using Different Models ===\n');

  const codexService = new CodexService();

  // Start thread with gpt-5-codex
  const thread = await codexService.startThread({
    workingDirectory: process.cwd(),
    skipGitRepoCheck: true,
    model: 'gpt-5-codex',
  });

  // Run with a different model for this specific turn
  const turn = await codexService.run(
    thread,
    'Analyze the codebase structure',
    {
      model: 'gpt-5.1-codex', // Override model for this run
    }
  );

  console.log('Response:', turn.finalResponse);
}

/**
 * Example 3: Using runStream for real-time updates
 */
async function streamingExample() {
  console.log('\n=== Example 3: Streaming Example ===\n');

  const codexService = new CodexService();

  const thread = await codexService.startThread({
    workingDirectory: process.cwd(),
    skipGitRepoCheck: true,
    model: 'gpt-5-codex',
  });

  // Get streaming events
  const events = await codexService.runStream(
    thread,
    'Explain what this codebase does'
  );

  // Process events as they come in
  for await (const event of events) {
    switch (event.type) {
      case 'response.delta':
        // Print streaming text as it arrives
        process.stdout.write(event.delta || '');
        break;
      case 'item.completed':
        console.log('\n\nItem completed:', event.item);
        break;
      case 'turn.completed':
        console.log('\n\nTurn completed. Usage:', event.usage);
        break;
    }
  }
}

/**
 * Example 4: Using runStreamWithHandler for easier event handling
 */
async function streamWithHandlerExample() {
  console.log('\n=== Example 4: Stream with Handler ===\n');

  const codexService = new CodexService();

  const thread = await codexService.startThread({
    workingDirectory: process.cwd(),
    skipGitRepoCheck: true,
    model: 'gpt-5-codex',
  });

  // Run with event handler
  const result = await codexService.runStreamWithHandler(
    thread,
    'What are the main services in this application?',
    async (event) => {
      if (event.type === 'response.delta') {
        process.stdout.write(event.delta || '');
      } else if (event.type === 'item.completed') {
        console.log('\n✓ Completed item:', event.item?.type);
      }
    }
  );

  console.log('\n\nFinal result:', result);
}

/**
 * Example 5: Resuming an existing thread
 */
async function resumeThreadExample() {
  console.log('\n=== Example 5: Resume Thread ===\n');

  const codexService = new CodexService();

  // Start a thread and save its ID
  const thread1 = await codexService.startThread({
    workingDirectory: process.cwd(),
    skipGitRepoCheck: true,
  });

  await codexService.run(thread1, 'List all services');

  // Get the thread ID (this would typically be saved to a database)
  const threadId = (thread1 as any).id;
  console.log('Thread ID:', threadId);

  // Later, resume the thread
  const thread2 = await codexService.resumeThread(threadId);

  // Continue the conversation
  const turn = await codexService.run(
    thread2,
    'Now explain what each service does'
  );

  console.log('Response:', turn.finalResponse);
}

/**
 * Example 6: Using YOLO mode (danger-full-access + never approval)
 */
async function yoloModeExample() {
  console.log('\n=== Example 6: YOLO Mode ===\n');

  const codexService = new CodexService();

  // Start thread with YOLO mode enabled
  const thread = await codexService.startThread({
    workingDirectory: process.cwd(),
    skipGitRepoCheck: true,
    yoloMode: true, // Enables danger-full-access + never approval
    model: 'gpt-5-codex',
  });

  // This will run without any approval prompts or sandbox restrictions
  const turn = await codexService.run(
    thread,
    'Run the build and fix any errors'
  );

  console.log('Response:', turn.finalResponse);
}

/**
 * Example 7: Using structured output with JSON schema
 */
async function structuredOutputExample() {
  console.log('\n=== Example 7: Structured Output ===\n');

  const codexService = new CodexService();

  const thread = await codexService.startThread({
    workingDirectory: process.cwd(),
    skipGitRepoCheck: true,
  });

  // Define output schema
  const schema = {
    type: 'object',
    properties: {
      services: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            file: { type: 'string' },
          },
          required: ['name', 'description', 'file'],
        },
      },
      summary: { type: 'string' },
    },
    required: ['services', 'summary'],
    additionalProperties: false,
  };

  // Run with schema
  const turn = await codexService.run(
    thread,
    'Analyze all services in the src/services directory',
    { outputSchema: schema }
  );

  console.log('Structured response:', JSON.parse(turn.finalResponse));
}

/**
 * Example 8: Quick run helper method
 */
async function quickRunExample() {
  console.log('\n=== Example 8: Quick Run ===\n');

  const codexService = new CodexService();

  // Quick run creates a thread and runs the prompt in one call
  const turn = await codexService.quickRun(
    'Count how many files are in the src directory',
    {
      workingDirectory: process.cwd(),
      skipGitRepoCheck: true,
      model: 'gpt-5-codex',
    }
  );

  console.log('Response:', turn.finalResponse);
}

/**
 * Example 9: Quick run with streaming
 */
async function quickRunStreamExample() {
  console.log('\n=== Example 9: Quick Run Stream ===\n');

  const codexService = new CodexService();

  // Quick run with streaming
  const result = await codexService.quickRunStream(
    'Explain the architecture of this application',
    async (event) => {
      if (event.type === 'response.delta') {
        process.stdout.write(event.delta || '');
      }
    },
    {
      workingDirectory: process.cwd(),
      skipGitRepoCheck: true,
      model: 'gpt-5-codex',
    }
  );

  console.log('\n\nDone!');
}

/**
 * Example 10: Manual approval and sandbox control
 */
async function manualControlExample() {
  console.log('\n=== Example 10: Manual Approval/Sandbox Control ===\n');

  const codexService = new CodexService();

  const thread = await codexService.startThread({
    workingDirectory: process.cwd(),
    skipGitRepoCheck: true,
    model: 'gpt-5-codex',
    approvalMode: 'on-request', // Ask for approval on certain actions
    sandboxMode: 'workspace-write', // Allow writes to workspace only
  });

  const turn = await codexService.run(
    thread,
    'Create a new file with some example code'
  );

  console.log('Response:', turn.finalResponse);
}

// Main function to run examples
async function main() {
  try {
    // Uncomment the example you want to run

    // await basicExample();
    // await differentModelExample();
    // await streamingExample();
    // await streamWithHandlerExample();
    // await resumeThreadExample();
    // await yoloModeExample();
    // await structuredOutputExample();
    // await quickRunExample();
    // await quickRunStreamExample();
    // await manualControlExample();

    console.log('\n✓ All examples completed successfully!\n');
  } catch (error) {
    logger.error('Error running examples', { error });
    console.error('Error:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main();
}

export {
  basicExample,
  differentModelExample,
  streamingExample,
  streamWithHandlerExample,
  resumeThreadExample,
  yoloModeExample,
  structuredOutputExample,
  quickRunExample,
  quickRunStreamExample,
  manualControlExample,
};
