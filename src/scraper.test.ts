import Scraper from './scraper';

describe('Scraper', () => {
  let scraper: Scraper;

  beforeAll(async () => {
    scraper = new Scraper();
    await scraper.initialize();
  });

  afterAll(async () => {
    await scraper.close();
  });

  test('should initialize browser', async () => {
    expect(scraper).toBeDefined();
  });

  test('should scrape webscraper.io test site', async () => {
    const result = await scraper.scrapeWebscraper(1);

    expect(result.success).toBe(true);
    expect(result.url).toBe('https://webscraper.io/test-sites');
    expect(result.data).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  test('should handle custom scraping', async () => {
    const result = await scraper.scrapeCustom({
      url: 'https://webscraper.io/test-sites',
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  test('should handle invalid URL', async () => {
    const result = await scraper.scrapeCustom({
      url: 'https://invalid-domain-that-does-not-exist-12345.com',
      timeout: 5000,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
