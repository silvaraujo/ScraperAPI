import { test, expect } from '@playwright/test';

test.describe('Scraper API', () => {
  test('should scrape test sites', async ({ request }) => {
    const response = await request.get('/api/scrape/sites');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data).toHaveProperty('meta');
    expect(data.meta).toHaveProperty('count');
    expect(data.meta).toHaveProperty('durationMs');
    expect(data.meta).toHaveProperty('timestamp');

    if (data.data.length > 0) {
      const site = data.data[0];
      expect(site).toHaveProperty('title');
      expect(site).toHaveProperty('url');
    }
  }, { timeout: 60000 });

  test('should scrape ecommerce products with default limit', async ({ request }) => {
    const response = await request.get('/api/scrape/ecommerce/products');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.meta).toHaveProperty('count');
    expect(data.data.length).toBeLessThanOrEqual(10);
  }, { timeout: 60000 });

  test('should scrape ecommerce products with custom limit', async ({ request }) => {
    const response = await request.get('/api/scrape/ecommerce/products?limit=5');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data.data.length).toBeLessThanOrEqual(5);
  }, { timeout: 60000 });

  test('should validate limit parameter', async ({ request }) => {
    const response = await request.get('/api/scrape/ecommerce/products?limit=100');
    expect(response.status()).toBe(400);
  });

  test('should run scrape task for test-sites target', async ({ request }) => {
    const response = await request.post('/api/scrape/run', {
      data: {
        target: 'test-sites',
        limit: 10,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  }, { timeout: 60000 });

  test('should run scrape task for ecommerce target', async ({ request }) => {
    const response = await request.post('/api/scrape/run', {
      data: {
        target: 'ecommerce',
        limit: 5,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  }, { timeout: 60000 });

  test('should reject invalid target in scrape run', async ({ request }) => {
    const response = await request.post('/api/scrape/run', {
      data: {
        target: 'invalid-target',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should reject missing target in scrape run', async ({ request }) => {
    const response = await request.post('/api/scrape/run', {
      data: {},
    });

    expect(response.status()).toBe(400);
  });
});

test.describe('Smoke Tests', () => {
  test('should run smoke test for test-sites', async ({ request }) => {
    const response = await request.post('/api/tests/smoke', {
      data: {
        target: 'test-sites',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('target', 'test-sites');
    expect(data.data).toHaveProperty('passed');
    expect(data.data).toHaveProperty('checks');
    expect(Array.isArray(data.data.checks)).toBe(true);
    expect(data.data.checks.length).toBeGreaterThan(0);
  }, { timeout: 60000 });

  test('should run smoke test for ecommerce', async ({ request }) => {
    const response = await request.post('/api/tests/smoke', {
      data: {
        target: 'ecommerce',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data.data).toHaveProperty('target', 'ecommerce');
    expect(data.data).toHaveProperty('passed');
    expect(data.data).toHaveProperty('checks');
  }, { timeout: 60000 });

  test('should reject invalid target in smoke test', async ({ request }) => {
    const response = await request.post('/api/tests/smoke', {
      data: {
        target: 'invalid',
      },
    });

    expect(response.status()).toBe(400);
  });
});
