import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import logger from '../utils/logger';
import { config } from '../config/environment';
import { ThemeInfo } from '../types/theme.types';
import codexService from './codex.instance';
import type CodexService from './codex.service';

const execAsync = promisify(exec);

export class ShopifyService {
  constructor() {
  }
  async listThemes(): Promise<ThemeInfo[]> {
    logger.info(`Listing themes for store: ${config.SHOPIFY_STORE_URL}`);

    const cmd = `shopify theme list --store ${config.SHOPIFY_STORE_URL} --password ${config.SHOPIFY_THEME_PASSWORD} --json`;

    try {
      const { stdout, stderr } = await execAsync(cmd);

      const jsonOutput = stdout.trim() || stderr.trim();

      if (!jsonOutput) {
        throw new Error('No output from Shopify CLI');
      }

      const themesRaw = JSON.parse(jsonOutput);

      const themes: ThemeInfo[] = themesRaw.map((theme: any) => ({
        name: theme.name,
        id: String(theme.id),
        role: theme.role
      }));

      logger.info(`Found ${themes.length} themes`);
      return themes;

    } catch (error: any) {
      logger.error(`Error listing themes: ${error.message}`);
      throw error;
    }
  }

  async duplicateTheme(themeId: string, sessionId: string): Promise<string> {
    logger.info(`Duplicating theme ${themeId} with name ${sessionId}`);

    const cmd = `shopify theme duplicate --store=${config.SHOPIFY_STORE_URL} --password=${config.SHOPIFY_THEME_PASSWORD} --theme=${themeId} --force --name=${sessionId} --json`;

    const { stdout, stderr } = await execAsync(cmd);
    const output = stdout.trim() || stderr.trim();

    if (!output) {
      throw new Error('No output from theme duplicate command');
    }
    const result = JSON.parse(output);

    if (!result.theme?.id) {
      throw new Error(`Theme duplication failed, theme output ${output}`);
    }

    const newThemeId = String(result.theme.id);
    logger.info(`Theme duplicated successfully. New theme ID: ${newThemeId}`);
    return newThemeId;
  }


  async pullTheme(themeId: string): Promise<string> {
    logger.info(`Pulling theme ${themeId} from ${config.SHOPIFY_STORE_URL}`);

    const downloadBase = path.resolve(config.THEME_DOWNLOAD_PATH);
    const themePath = path.join(downloadBase, themeId);

    await fs.mkdir(themePath, { recursive: true });

    const maxRetries = config.THEME_PULL_MAX_RETRIES;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        logger.info(`Retry attempt ${attempt}/${maxRetries} - waiting ${config.THEME_PULL_RETRY_DELAY_SECONDS} seconds before retrying...`);
        await new Promise(resolve => setTimeout(resolve, config.THEME_PULL_RETRY_DELAY_SECONDS * 1000));
      }

      logger.info(`Pulling theme (attempt ${attempt + 1}/${maxRetries + 1})...`);

      const cmd = `shopify theme pull --store ${config.SHOPIFY_STORE_URL} --password ${config.SHOPIFY_THEME_PASSWORD} --theme ${themeId} --path ${themePath} --force`;

      await execAsync(cmd, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 300000
      });

      const files = await fs.readdir(themePath);
      logger.info(`Files in directory after pull: ${files.length} files`);

      if (files.length > 0) {
        logger.info(`Theme pulled successfully to: ${themePath}`);
        return themePath;
      }

      logger.warn(`Pull completed but directory is empty`);
    }

    throw new Error(`Failed to pull theme after ${maxRetries + 1} attempts - directory remains empty`);
  }
  

  async runThemeDev(themeId: string): Promise<void> {
    logger.info(`Starting theme dev server for theme ${themeId}`);

    const downloadBase = path.resolve(config.THEME_DOWNLOAD_PATH);
    const themePath = path.join(downloadBase, themeId);

    // Verify directory exists
    try {
      await fs.access(themePath);
      const files = await fs.readdir(themePath);
      logger.info(`Theme directory exists with ${files.length} files`);
    } catch (error: any) {
      throw new Error(`Theme directory not found: ${themePath}`);
    }

    // Create a wrapper script that uses script command for pseudo-TTY
    const wrapperScriptPath = path.join(themePath, 'run-theme-dev.sh');
    const wrapperScript = `#!/bin/bash
export SHOPIFY_CLI_THEME_TOKEN="${config.SHOPIFY_THEME_PASSWORD}"
export SHOPIFY_CLI_NO_ANALYTICS=1
export CI=1

# Use script to create a pseudo-TTY and run shopify theme dev
script -q -c "shopify theme dev --path ${themePath} --password ${config.SHOPIFY_THEME_PASSWORD} --port 9292 --store-password neecra" /dev/null
`;

    await fs.writeFile(wrapperScriptPath, wrapperScript, 'utf-8');
    await execAsync(`chmod +x ${wrapperScriptPath}`);

    logger.info(`Created wrapper script at ${wrapperScriptPath}`);
    logger.info(`Running shopify theme dev with path: ${themePath}`);

    const shopifyProcess = spawn('bash', [wrapperScriptPath], {
      stdio: 'inherit',
      shell: false,
      cwd: themePath,
    });

    shopifyProcess.on('error', (error) => {
      logger.error(`Theme dev error: ${error.message}`);
    });

    shopifyProcess.on('exit', (code) => {
      logger.info(`Theme dev process exited with code ${code}`);
    });

    logger.info(`Theme dev server started for theme ${themeId}`);
  }

  async downloadTheme(themeId: string): Promise<{ themeId: string; envId: string }> {
    logger.info(`Starting download workflow for theme ${themeId}`);

    const newThemeId = await this.duplicateTheme(themeId, config.SESSION_ID);

    logger.info(`Waiting ${config.THEME_DUPLICATE_WAIT_SECONDS} seconds for theme duplication to complete...`);
    await new Promise(resolve => setTimeout(resolve, config.THEME_DUPLICATE_WAIT_SECONDS * 1000));

    const themePath = await this.pullTheme(newThemeId);

    // Setup Codex environment for the downloaded theme
    logger.info('Setting up Codex environment for theme...');
    const codexEnv = await codexService.setupEnvironment(
      themePath,
      config.CODEX_MODEL
    );

    logger.info('Codex environment setup complete', {
      envId: codexEnv.envId,
      model: codexEnv.model,
      yoloMode: codexEnv.yoloMode,
    });

    await this.runThemeDev(newThemeId);

    logger.info(`Download workflow completed. New theme ID: ${newThemeId}`);
    return { themeId: newThemeId, envId: codexEnv.envId };
  }

  /**
   * Get the CodexService instance
   * @returns CodexService instance
   */
  getCodexService(): CodexService {
    return codexService;
  }
}
