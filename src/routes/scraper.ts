import { Router, Request, Response } from 'express';
import Scraper, { ScraperOptions } from '../scraper';
import logger from '../config/logger';

const router = Router();
const scraper = new Scraper();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /scrape/webscraper:
 *   get:
 *     summary: Scrape webscraper.io test site
 *     tags:
 *       - Scraper
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Successfully scraped data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScrapedData'
 *       500:
 *         description: Scraping error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/scrape/webscraper', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    logger.info(`Scraping webscraper.io page ${page}`);

    const result = await scraper.scrapeWebscraper(page);
    res.json(result);
  } catch (error) {
    logger.error('Route error:', error);
    res.status(500).json({
      error: 'Scraping failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /scrape/custom:
 *   post:
 *     summary: Scrape a custom URL
 *     tags:
 *       - Scraper
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               selector:
 *                 type: string
 *                 description: CSS selector to scrape specific elements
 *               timeout:
 *                 type: integer
 *                 default: 30000
 *                 description: Timeout in milliseconds
 *     responses:
 *       200:
 *         description: Successfully scraped data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScrapedData'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Scraping error
 */
router.post('/scrape/custom', async (req: Request, res: Response) => {
  try {
    const { url, selector, timeout } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'URL is required',
        timestamp: new Date().toISOString(),
      });
    }

    const options: ScraperOptions = {
      url,
      selector,
      timeout,
    };

    logger.info(`Custom scraping request: ${url}`);
    const result = await scraper.scrapeCustom(options);
    res.json(result);
  } catch (error) {
    logger.error('Route error:', error);
    res.status(500).json({
      error: 'Scraping failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Get API status and information
 *     tags:
 *       - Info
 *     responses:
 *       200:
 *         description: API status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   type: string
 *                 version:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                 environment:
 *                   type: string
 */
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    service: 'playwright-scraper-api',
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

export default router;
