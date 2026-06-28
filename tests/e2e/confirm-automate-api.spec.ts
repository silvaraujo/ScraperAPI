import { test, expect, APIResponse } from '@playwright/test';

// ─── Constantes ─────────────────────────────────────────────────────────────
const ENDPOINT = '/api/confirmAction';

const VALID_PAYLOADS = {
  ifood: {
    source: 'ifood',
    locator: '21647131',
    orderCode: '1234',
  },
  '99food': {
    source: '99food',
    locator: '86662935',
    orderCode: '1234',
  },
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** POST para o endpoint e devolve { response, body } já parseados. */
async function postConfirm(
  request: InstanceType<typeof import('@playwright/test').APIRequestContext>,
  data: Record<string, unknown>,
) {
  const response: APIResponse = await request.post(ENDPOINT, { data });
  const body = await response.json();
  return { response, body };
}

/** Verifica as propriedades comuns de uma resposta de sucesso. */
function assertSuccessResponse(
  body: Record<string, unknown>,
  expectedSource: string,
) {
  expect(body).toHaveProperty('success', true);
  expect(body).toHaveProperty('data');
  expect(body).toHaveProperty('meta');

  const meta = body.meta as Record<string, unknown>;
  expect(meta).toHaveProperty('source', expectedSource);
  expect(meta).toHaveProperty('durationMs');
  expect(typeof meta.durationMs).toBe('number');
  expect(meta).toHaveProperty('timestamp');
}

/** Verifica as propriedades comuns de uma resposta de erro 400. */
function assertValidationError(body: Record<string, unknown>) {
  expect(body).toHaveProperty('success', false);
  expect(body).toHaveProperty('error');
  expect(typeof body.error).toBe('string');
  expect((body.error as string).length).toBeGreaterThan(0);
  expect(body).toHaveProperty('meta');
}

// ─── Testes de integração: fluxo de sucesso ─────────────────────────────────
test.describe('POST /api/confirmAction — Fluxo de sucesso', () => {
  test.setTimeout(120_000);

  test('iFood: deve confirmar pedido válido e retornar 200', async ({ request }) => {
    const { response, body } = await postConfirm(request, VALID_PAYLOADS.ifood);

    expect(response.status()).toBe(200);
    assertSuccessResponse(body, 'ifood');
  });

  test('99food: deve confirmar pedido válido e retornar 200', async ({ request }) => {
    const { response, body } = await postConfirm(request, VALID_PAYLOADS['99food']);

    expect(response.status()).toBe(200);
    assertSuccessResponse(body, '99food');
  });
});

// ─── Testes de validação de schema (Zod) ────────────────────────────────────
test.describe('POST /api/confirmAction — Validação de entrada', () => {

  // ── source ────────────────────────────────────────────────────────────────

  test.describe('campo "source"', () => {
    test('deve rejeitar quando ausente', async ({ request }) => {
      const { response, body } = await postConfirm(request, {
        locator: '26893427',
        orderCode: '1234',
      });

      expect(response.status()).toBe(400);
      assertValidationError(body);
    });

    test('deve rejeitar valor não permitido ("uber")', async ({ request }) => {
      const { response, body } = await postConfirm(request, {
        source: 'uber',
        locator: '26893427',
        orderCode: '1234',
      });

      expect(response.status()).toBe(400);
      assertValidationError(body);
    });

    test('deve rejeitar valor vazio', async ({ request }) => {
      const { response, body } = await postConfirm(request, {
        source: '',
        locator: '26893427',
        orderCode: '1234',
      });

      expect(response.status()).toBe(400);
      assertValidationError(body);
    });
  });

  // ── locator ───────────────────────────────────────────────────────────────

  test.describe('campo "locator"', () => {
    const validBase = { source: 'ifood', orderCode: '1234' };

    test('deve rejeitar quando ausente', async ({ request }) => {
      const { response, body } = await postConfirm(request, {
        source: 'ifood',
        orderCode: '1234',
      });

      expect(response.status()).toBe(400);
      assertValidationError(body);
    });

    test('deve rejeitar com menos de 8 dígitos', async ({ request }) => {
      const { response, body } = await postConfirm(request, {
        ...validBase,
        locator: '1234',
      });

      expect(response.status()).toBe(400);
      assertValidationError(body);
    });

    test('deve rejeitar com mais de 8 dígitos', async ({ request }) => {
      const { response, body } = await postConfirm(request, {
        ...validBase,
        locator: '123456789',
      });

      expect(response.status()).toBe(400);
      assertValidationError(body);
    });

    test('deve rejeitar com caracteres não numéricos', async ({ request }) => {
      const { response, body } = await postConfirm(request, {
        ...validBase,
        locator: 'abcd1234',
      });

      expect(response.status()).toBe(400);
      assertValidationError(body);
    });
  });

  // ── orderCode ─────────────────────────────────────────────────────────────

  test.describe('campo "orderCode"', () => {
    const validBase = { source: 'ifood', locator: '26893427' };

    test('deve rejeitar quando ausente', async ({ request }) => {
      const { response, body } = await postConfirm(request, {
        source: 'ifood',
        locator: '26893427',
      });

      expect(response.status()).toBe(400);
      assertValidationError(body);
    });

    test('deve rejeitar com menos de 4 dígitos', async ({ request }) => {
      const { response, body } = await postConfirm(request, {
        ...validBase,
        orderCode: '12',
      });

      expect(response.status()).toBe(400);
      assertValidationError(body);
    });

    test('deve rejeitar com mais de 4 dígitos', async ({ request }) => {
      const { response, body } = await postConfirm(request, {
        ...validBase,
        orderCode: '12345',
      });

      expect(response.status()).toBe(400);
      assertValidationError(body);
    });

    test('deve rejeitar com caracteres não numéricos', async ({ request }) => {
      const { response, body } = await postConfirm(request, {
        ...validBase,
        orderCode: 'abcd',
      });

      expect(response.status()).toBe(400);
      assertValidationError(body);
    });
  });

  // ── body vazio / inválido ─────────────────────────────────────────────────

  test.describe('body inválido', () => {
    test('deve rejeitar body vazio ({})', async ({ request }) => {
      const { response, body } = await postConfirm(request, {});

      expect(response.status()).toBe(400);
      assertValidationError(body);
    });

    test('deve rejeitar body com campos extras mas sem os obrigatórios', async ({ request }) => {
      const { response, body } = await postConfirm(request, {
        foo: 'bar',
        baz: 123,
      });

      expect(response.status()).toBe(400);
      assertValidationError(body);
    });
  });
});
