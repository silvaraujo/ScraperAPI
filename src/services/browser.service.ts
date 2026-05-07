import { chromium, Browser, Page, BrowserContext } from 'playwright';
import logger from '../config/logger';
import env from '../config/env';

export class BrowserService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  async initialize(): Promise<void> {
    if (this.browser) return;

    logger.info('Initializing Playwright browser');
    this.browser = await chromium.launch({
      headless: env.PLAYWRIGHT_HEADLESS,
    });

    this.context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });
  }

  async createPage(): Promise<Page> {
    if (!this.browser) {
      await this.initialize();
    }

    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    const page = await this.context.newPage();
    page.setDefaultTimeout(env.PLAYWRIGHT_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(env.PLAYWRIGHT_TIMEOUT_MS);

    return page;
  }

  async closePage(page: Page): Promise<void> {
    try {
      await page.close();
    } catch (error) {
      logger.warn('Error closing page:', error);
    }
  }

  async close(): Promise<void> {
    if (this.context) {
      try {
        await this.context.close();
      } catch (error) {
        logger.warn('Error closing context:', error);
      }
      this.context = null;
    }

    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        logger.warn('Error closing browser:', error);
      }
      this.browser = null;
    }

    logger.info('Browser closed');
  }

  isInitialized(): boolean {
    return this.browser !== null;
  }
}

export const browserService = new BrowserService();
