import { chromium, firefox, webkit, Browser, Page } from 'playwright';
import logger from './config/logger';

export interface ScraperOptions {
  url: string;
  selector?: string;
  timeout?: number;
  headless?: boolean;
  browser?: 'chromium' | 'firefox' | 'webkit';
}

export interface ScraperResult {
  success: boolean;
  url: string;
  data?: Record<string, any>;
  error?: string;
  timestamp: string;
}

class Scraper {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    const browserType = process.env.PLAYWRIGHT_BROWSER || 'chromium';
    logger.info(`Initializing Playwright with ${browserType} browser`);

    switch (browserType) {
      case 'firefox':
        this.browser = await firefox.launch();
        break;
      case 'webkit':
        this.browser = await webkit.launch();
        break;
      default:
        this.browser = await chromium.launch();
    }
  }

  async scrapeWebscraper(_pageNumber: number = 1): Promise<ScraperResult> {
    try {
      if (!this.browser) {
        await this.initialize();
      }

      const page = await this.browser!.newPage();
      const timeout = parseInt(process.env.PLAYWRIGHT_TIMEOUT_MS || '30000', 10);
      page.setDefaultTimeout(timeout);

      const url = `https://webscraper.io/test-sites`;
      logger.info(`Scraping ${url}`);

      await page.goto(url, { waitUntil: 'networkidle' });

      // Scrape page content
      const data = await page.evaluate(() => {
        const items: Record<string, any>[] = [];

        // Scrape products
        const products = document.querySelectorAll('.row .col-sm-4');
        products.forEach((product) => {
          const titleEl = product.querySelector('.title');
          const descEl = product.querySelector('.description');
          const priceEl = product.querySelector('.price');

          items.push({
            title: titleEl?.textContent?.trim(),
            description: descEl?.textContent?.trim(),
            price: priceEl?.textContent?.trim(),
          });
        });

        return {
          title: document.title,
          itemCount: items.length,
          items: items.slice(0, 10), // Return first 10 items
        };
      });

      await page.close();

      return {
        success: true,
        url,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Scraping error:', error);
      return {
        success: false,
        url: 'https://webscraper.io/test-sites',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async scrapeCustom(options: ScraperOptions): Promise<ScraperResult> {
    try {
      if (!this.browser) {
        await this.initialize();
      }

      const page = await this.browser!.newPage();
      const timeout = options.timeout || parseInt(process.env.PLAYWRIGHT_TIMEOUT_MS || '30000', 10);
      page.setDefaultTimeout(timeout);

      logger.info(`Scraping custom URL: ${options.url}`);
      await page.goto(options.url, { waitUntil: 'networkidle' });

      let data: Record<string, any> = {};

      if (options.selector) {
        data = await page.evaluate((selector) => {
          const elements = document.querySelectorAll(selector);
          return {
            selectorMatches: elements.length,
            content: Array.from(elements).map(el => ({
              text: el.textContent?.trim(),
              html: el.innerHTML,
            })),
          };
        }, options.selector);
      } else {
        data = await page.evaluate(() => ({
          title: document.title,
          url: window.location.href,
          html: document.documentElement.outerHTML.substring(0, 500),
        }));
      }

      await page.close();

      return {
        success: true,
        url: options.url,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Custom scraping error:', error);
      return {
        success: false,
        url: options.url,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Playwright browser closed');
    }
  }
}

export default Scraper;
