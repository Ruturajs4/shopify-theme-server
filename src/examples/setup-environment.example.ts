/**
 * Example: Using setupEnvironment function
 *
 * This demonstrates how Codex is automatically set up when a theme is downloaded.
 */

import CodexService from '../services/codex.service';
import { config } from '../config/environment';
import path from 'path';

async function demonstrateSetupEnvironment() {
  console.log('='.repeat(70));
  console.log('Codex setupEnvironment() Demonstration');
  console.log('='.repeat(70));
  console.log();

  // Initialize CodexService (no API key needed - user sets it themselves)
  const codexService = new CodexService();

  // Simulate a theme directory path
  const themePath = path.join(
    config.THEME_DOWNLOAD_PATH,
    '123456789' // Example theme ID
  );

  console.log('Step 1: Setting up Codex environment');
  console.log('-'.repeat(70));
  console.log(`Working Directory: ${themePath}`);
  console.log(`Model: ${config.CODEX_MODEL}`);
  console.log('YOLO Mode: true (no approvals, full access)');
  console.log('skipGitRepoCheck: false (enforces Git repo)');
  console.log();

  // Setup the environment (this is what happens after fetchAndDownloadTheme)
  const environment = await codexService.setupEnvironment(themePath, config.CODEX_MODEL);

  console.log('✓ Environment setup complete!');
  console.log();
  console.log('Environment Details:');
  console.log(`  - Environment ID: ${environment.envId}`);
  console.log(`  - Working Directory: ${environment.workingDirectory}`);
  console.log(`  - Model: ${environment.model}`);
  console.log(`  - YOLO Mode: ${environment.yoloMode}`);
  console.log();

  console.log('Step 2: Verify environment is stored');
  console.log('-'.repeat(70));

  // Get the environment back
  const storedEnv = codexService.getEnvironment(environment.envId);
  if (storedEnv) {
    console.log('✓ Environment found in storage');
    console.log(`  Created at: ${storedEnv.createdAt}`);
  }
  console.log();

  console.log('Step 3: List all environments');
  console.log('-'.repeat(70));
  const allEnvironments = codexService.listEnvironments();
  console.log(`Total environments: ${allEnvironments.length}`);
  allEnvironments.forEach((env, index) => {
    console.log(`  ${index + 1}. ${env.envId} (${env.model})`);
  });
  console.log();

  console.log('Step 4: Using the environment thread');
  console.log('-'.repeat(70));
  console.log('The thread is ready to use with the following configuration:');
  console.log('  - Full filesystem access (danger-full-access)');
  console.log('  - No approval prompts (never)');
  console.log('  - Working in theme directory');
  console.log('  - Model: ' + environment.model);
  console.log();
  console.log('Example usage:');
  console.log('  const turn = await codexService.run(');
  console.log('    environment.thread,');
  console.log('    "Add a new section to the theme"');
  console.log('  );');
  console.log();

  console.log('Step 5: Cleanup');
  console.log('-'.repeat(70));
  const removed = codexService.removeEnvironment(environment.envId);
  if (removed) {
    console.log('✓ Environment removed successfully');
  }
  console.log();

  console.log('='.repeat(70));
  console.log('Complete! This is what happens automatically after theme download');
  console.log('='.repeat(70));
}

/**
 * Example of how it integrates with the theme download flow
 */
function showIntegrationFlow() {
  console.log();
  console.log('='.repeat(70));
  console.log('Integration Flow with fetchAndDownloadTheme');
  console.log('='.repeat(70));
  console.log();
  console.log('1. User requests to download theme');
  console.log('   POST /selected-theme { theme_id: "123456789" }');
  console.log();
  console.log('2. fetchAndDownloadTheme() is called:');
  console.log('   a. Duplicate theme on Shopify');
  console.log('   b. Pull theme to local directory');
  console.log('   c. *** setupEnvironment() is called ***');
  console.log('      - Creates Codex thread with YOLO mode');
  console.log('      - Sets working directory to theme path');
  console.log('      - Uses model from CODEX_MODEL env var or gpt-5.1-codex-max');
  console.log('      - Stores thread for later use');
  console.log('   d. Start theme dev server');
  console.log('   e. Send webhook notification');
  console.log();
  console.log('3. Codex is now ready to edit the theme');
  console.log('   - Access via codexService.getEnvironment(envId)');
  console.log('   - Run prompts to modify theme files');
  console.log('   - No manual approvals needed (YOLO mode)');
  console.log();
  console.log('='.repeat(70));
}

/**
 * Environment variables configuration example
 */
function showEnvironmentVariables() {
  console.log();
  console.log('='.repeat(70));
  console.log('Environment Variables');
  console.log('='.repeat(70));
  console.log();
  console.log('Required environment variables:');
  console.log('  OPENAI_API_KEY or CODEX_API_KEY - Your OpenAI API key');
  console.log('    (User sets this themselves, not handled by the service)');
  console.log();
  console.log('Optional environment variables:');
  console.log('  CODEX_MODEL - Override default model');
  console.log('    Default: gpt-5.1-codex-max');
  console.log('    Options: gpt-5-codex, gpt-5.1-codex, gpt-5-codex-mini, etc.');
  console.log();
  console.log('Example .env file:');
  console.log('  # Codex Configuration');
  console.log('  OPENAI_API_KEY=sk-your-api-key-here');
  console.log('  CODEX_MODEL=gpt-5.1-codex-max');
  console.log();
  console.log('='.repeat(70));
}

// Run demonstrations
if (require.main === module) {
  (async () => {
    await demonstrateSetupEnvironment();
    showIntegrationFlow();
    showEnvironmentVariables();
  })();
}

export { demonstrateSetupEnvironment, showIntegrationFlow, showEnvironmentVariables };
