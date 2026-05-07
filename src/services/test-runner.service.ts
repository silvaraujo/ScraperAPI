import { Page } from 'playwright';
import logger from '../config/logger';
import { browserService } from './browser.service';
import env from '../config/env';
import { SmokeTestResult, SmokeTestCheck } from '../types/scrape.types';

export class TestRunnerService {
  async runSmokeTest(target: 'test-sites' | 'ecommerce'): Promise<SmokeTestResult> {
    let page: Page | null = null;
    const startTime = Date.now();
    const checks: SmokeTestCheck[] = [];

    try {
      await browserService.initialize();
      page = await browserService.createPage();

      const url = target === 'test-sites' ? env.SCRAPER_BASE_URL : env.SCRAPER_ECOMMERCE_URL;

      // Check 1: Page loads successfully
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: env.PLAYWRIGHT_TIMEOUT_MS });
        checks.push({
          name: 'Page loads successfully',
          passed: true,
        });
      } catch (error) {
        checks.push({
          name: 'Page loads successfully',
          passed: false,
          error: error instanceof Error ? error.message : 'Failed to load page',
        });
        throw error;
      }

      // Check 2: Page has valid title
      const title = await page.title();
      checks.push({
        name: 'Page has valid title',
        passed: title.length > 0,
        error: title.length === 0 ? 'Page title is empty' : undefined,
      });

      // Check 3: Page content is visible
      const bodyText = await page.textContent('body');
      const hasContent = bodyText && bodyText.trim().length > 100;
      checks.push({
        name: 'Page has sufficient content',
        passed: hasContent || false,
        error: !hasContent ? 'Page content is too short' : undefined,
      });

      // Check 4: Target-specific checks
      if (target === 'test-sites') {
        const hasLinks = await page.locator('a').count();
        checks.push({
          name: 'Page contains test site links',
          passed: hasLinks > 0,
          error: hasLinks === 0 ? 'No links found' : undefined,
        });
      } else if (target === 'ecommerce') {
        const items = await page.locator('[class*="product"], [class*="item"], article').count();
        checks.push({
          name: 'Page contains products/items',
          passed: items > 0,
          error: items === 0 ? 'No products found' : undefined,
        });
      }

      // Check 5: No JavaScript errors
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(500);

      checks.push({
        name: 'No critical console errors',
        passed: errors.length === 0,
        error: errors.length > 0 ? `Found ${errors.length} errors` : undefined,
      });

      const allPassed = checks.every((c) => c.passed);

      logger.info(`Smoke test for ${target} completed. Status: ${allPassed ? 'PASSED' : 'FAILED'}`);

      return {
        target,
        passed: allPassed,
        checks,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error running smoke test for target ${target}:`, error);

      return {
        target,
        passed: false,
        checks: [
          ...checks,
          {
            name: 'Overall test',
            passed: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    } finally {
      if (page) {
        await browserService.closePage(page);
      }
    }
  }
}

export const testRunnerService = new TestRunnerService();
