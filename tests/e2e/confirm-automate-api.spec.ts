import { test, expect } from '@playwright/test';

// ─── Constantes de teste ────────────────────────────────────────────────────
// Usar os mesmos valores que já foram validados nos testes de browser.
const ENDPOINT = '/api/confirmAction';

const IFOOD_PAYLOAD = {
  source: 'ifood',
  locator: '21647131', // 8 dígitos — mesmo usado em ifood-confirmer.spec.ts
  orderCode: '1234',   // 4 dígitos — mesmo usado em ifood-confirmer.spec.ts
};

const FOOD99_PAYLOAD = {
  source: '99food',
  locator: '86662935', // 8 dígitos — mesmo usado em 99-confirmer.spec.ts
  orderCode: '1234',   // 4 dígitos — mesmo usado em 99-confirmer.spec.ts
};

// ─── Testes iFood ────────────────────────────────────────────────────────────
test.describe('API - Confirm Automate: iFood', () => {
  test.setTimeout(120_000); // Operações Playwright no service podem demorar

  test('deve retornar sucesso ao confirmar pedido iFood válido', async ({ request }) => {
    const response = await request.post(ENDPOINT, { data: IFOOD_PAYLOAD });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('meta');
    expect(body.meta).toHaveProperty('source', 'ifood');
    expect(body.meta).toHaveProperty('durationMs');
    expect(typeof body.meta.durationMs).toBe('number');
  });
});

// ─── Testes 99food ───────────────────────────────────────────────────────────
test.describe('API - Confirm Automate: 99food', () => {
  test.setTimeout(120_000);

  test('deve retornar sucesso ao confirmar pedido 99food válido', async ({ request }) => {
    const response = await request.post(ENDPOINT, { data: FOOD99_PAYLOAD });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('meta');
    expect(body.meta).toHaveProperty('source', '99food');
    expect(body.meta).toHaveProperty('durationMs');
    expect(typeof body.meta.durationMs).toBe('number');
  });
});

// ─── Validação de Schema (Zod) ───────────────────────────────────────────────
test.describe('API - Confirm Automate: Validação de entrada', () => {
  test('deve retornar 400 quando "source" está ausente', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { locator: '26893427', orderCode: '1234' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('success', false);
  });

  test('deve retornar 400 quando "source" é um valor não permitido', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { source: 'uber', locator: '26893427', orderCode: '1234' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('success', false);
  });

  test('deve retornar 400 quando "locator" tem menos de 8 dígitos', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { source: 'ifood', locator: '1234', orderCode: '1234' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('success', false);
  });

  test('deve retornar 400 quando "locator" tem mais de 8 dígitos', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { source: 'ifood', locator: '123456789', orderCode: '1234' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('success', false);
  });

  test('deve retornar 400 quando "orderCode" tem menos de 4 dígitos', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { source: 'ifood', locator: '26893427', orderCode: '12' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('success', false);
  });

  test('deve retornar 400 quando "orderCode" tem mais de 4 dígitos', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { source: 'ifood', locator: '26893427', orderCode: '12345' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('success', false);
  });

  test('deve retornar 400 quando o body está vazio', async ({ request }) => {
    const response = await request.post(ENDPOINT, { data: {} });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('success', false);
  });
});
