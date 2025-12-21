import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import logger from '../utils/logger';
import { config } from '../config/environment';
import { ThemeInfo } from '../types/theme.types';

const execAsync = promisify(exec);

export class ShopifyService {
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

    const cmd = `shopify theme dev --path=${themePath} --store=${config.SHOPIFY_STORE_URL} --password=${config.SHOPIFY_THEME_PASSWORD} --store-password=${config.SHOPIFY_STORE_PASSWORD} --force`;

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Theme dev error: ${error.message}`);
        return;
      }
      if (stdout) logger.info(`Theme dev: ${stdout}`);
      if (stderr) logger.error(`Theme dev stderr: ${stderr}`);
    });

    logger.info(`Theme dev server started for theme ${themeId}`);
  }

  async downloadTheme(themeId: string): Promise<string> {
    logger.info(`Starting download workflow for theme ${themeId}`);

    const newThemeId = await this.duplicateTheme(themeId, config.SESSION_ID);

    logger.info(`Waiting ${config.THEME_DUPLICATE_WAIT_SECONDS} seconds for theme duplication to complete...`);
    await new Promise(resolve => setTimeout(resolve, config.THEME_DUPLICATE_WAIT_SECONDS * 1000));

    await this.pullTheme(newThemeId);
    await this.runThemeDev(newThemeId);

    logger.info(`Download workflow completed. New theme ID: ${newThemeId}`);
    return newThemeId;
  }
}
