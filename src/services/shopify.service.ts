import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import logger from '../utils/logger';
import { config } from '../config/environment';
import { ThemeInfo } from '../types/theme.types';

const execAsync = promisify(exec);

export class ShopifyService {
  async listThemes(): Promise<ThemeInfo[]> {
    logger.info(`Listing themes for store: ${config.STORE_NAME}`);

    const cmd = `shopify theme list --store ${config.STORE_NAME} --password ${config.STORE_PASSWORD} --json`;

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

  async downloadTheme(themeName: string): Promise<string> {
    logger.info(`Downloading theme '${themeName}' from ${config.STORE_NAME}`);

    const downloadBase = path.resolve(config.THEME_DOWNLOAD_PATH);
    await fs.mkdir(downloadBase, { recursive: true });

    const themePath = path.join(downloadBase, themeName.replace(/\s+/g, '_'));
    await fs.mkdir(themePath, { recursive: true });

    const cmd = `shopify theme pull --store ${config.STORE_NAME} --password ${config.STORE_PASSWORD} --theme "${themeName}" --path ${themePath}`;

    try {
      await execAsync(cmd);
      logger.info(`Downloaded to: ${themePath}`);
      return themePath;

    } catch (error: any) {
      logger.error(`Error downloading theme: ${error.message}`);
      throw error;
    }
  }
}
