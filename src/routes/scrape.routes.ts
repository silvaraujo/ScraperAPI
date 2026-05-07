import { Router } from 'express';
import { getScrapeTestSites, getScrapeEcommerceProducts, postScrapeRun } from '../controllers/scrape.controller';

const router = Router();

/**
 * @swagger
 * /api/scrape/sites:
 *   get:
 *     summary: Scrape webscraper.io test sites
 *     tags:
 *       - Scraper
 *     responses:
 *       200:
 *         description: Successfully scraped test sites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScrapeSite'
 *                 meta:
 *                   $ref: '#/components/schemas/Meta'
 *       500:
 *         description: Scraping error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/sites', getScrapeTestSites);

/**
 * @swagger
 * /api/scrape/ecommerce/products:
 *   get:
 *     summary: Scrape e-commerce products
 *     tags:
 *       - Scraper
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of products to scrape
 *       - in: query
 *         name: headless
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'true'
 *         description: Run browser in headless mode
 *     responses:
 *       200:
 *         description: Successfully scraped products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 meta:
 *                   $ref: '#/components/schemas/Meta'
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Scraping error
 */
router.get('/ecommerce/products', getScrapeEcommerceProducts);

/**
 * @swagger
 * /api/scrape/run:
 *   post:
 *     summary: Run a scraping task
 *     tags:
 *       - Scraper
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target
 *             properties:
 *               target:
 *                 type: string
 *                 enum: ['test-sites', 'ecommerce']
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *               headless:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Scraping task completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 meta:
 *                   $ref: '#/components/schemas/Meta'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Scraping error
 */
router.post('/run', postScrapeRun);

export default router;
