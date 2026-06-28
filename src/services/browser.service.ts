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
      args: [
        '--no-sandbox',                           // Obrigatório no Railway (Linux sem root)
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled', // Remove flag de automação detectável
        '--disable-dev-shm-usage',                // Evita crash por /dev/shm limitado em containers
        '--disable-gpu',                          // Railway não tem GPU
        '--disable-extensions',
        '--no-first-run',
        '--no-default-browser-check',
      ],
    });

    this.context = await this.browser.newContext({
      // User-Agent atualizado (Chrome 131 — Dez/2024)
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      // Evita que o site detecte ausência de locale/timezone
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
    });

    // Oculta navigator.webdriver antes de cada página para evitar detecção de bot
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
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
