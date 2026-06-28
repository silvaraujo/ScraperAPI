import { test, expect, Page } from '@playwright/test';
import path from 'path';

/**
 * ─── Teste E2E "headed" do fluxo 99food ─────────────────────────────────────
 *
 * Este spec replica passo a passo o que o 99food-automate.service.ts faz,
 * mas de forma **observável**: com logs, screenshots e assertions granulares
 * em cada etapa. Serve como guia de diagnóstico para entender onde o service
 * está falhando.
 *
 * Executar:
 *   npx playwright test tests/e2e/99food-confirmer.spec.ts --headed --project=chromium
 *
 * Para modo lento (ver cada ação):
 *   PWDEBUG=1 npx playwright test tests/e2e/99food-confirmer.spec.ts --headed --project=chromium
 */

// ─── Configuração ───────────────────────────────────────────────────────────

const BASE_URL = process.env.AUTOMATE_99FOOD_URL
  || 'https://food-b-h5.99app.com/pt-BR/v2/confirmation-entrega/delivery-code';

// Valores de teste — altere conforme o pedido real que quer testar
const LOCATOR   = process.env.TEST_LOCATOR    || '98717677';
const CODE      = process.env.TEST_CODE       || '0173';
const ORDER_ID  = process.env.TEST_ORDER_ID   || '5764676115121636389';
const SHOP_ID   = process.env.TEST_SHOP_ID    || '5764608616649458963';

const SCREENSHOT_DIR = path.resolve('test-results', '99food-debug');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Salva screenshot com nome descritivo e loga no console. */
async function snap(page: Page, stepName: string) {
  const fileName = `${stepName.replace(/\s+/g, '_').toLowerCase()}.png`;
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, fileName),
    fullPage: true,
  });
  console.log(`  📸 Screenshot: ${fileName}`);
}

/** Loga contagem e tipos de inputs visíveis na página. */
async function logInputState(page: Page, label: string) {
  const inputInfo = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('input'));
    return {
      total: all.length,
      byType: all.reduce((acc, el) => {
        const t = el.type || 'unknown';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      visible: all.filter(el => {
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && (el as HTMLElement).offsetHeight > 0;
      }).length,
    };
  });
  console.log(`  🔍 [${label}] Inputs — total: ${inputInfo.total}, visíveis: ${inputInfo.visible}, tipos:`, inputInfo.byType);
  return inputInfo;
}

/** Loga todos os botões visíveis com seu texto. */
async function logButtons(page: Page, label: string) {
  const buttons = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('button, [type="button"], [role="button"]'));
    return els
      .filter(el => {
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && (el as HTMLElement).offsetHeight > 0;
      })
      .map(el => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim().substring(0, 80) || '(vazio)',
        disabled: (el as HTMLButtonElement).disabled,
        classes: (el as HTMLElement).className.substring(0, 100),
      }));
  });
  console.log(`  🔘 [${label}] Botões visíveis (${buttons.length}):`);
  buttons.forEach((b, i) => console.log(`     ${i + 1}. [${b.tag}] "${b.text}" disabled=${b.disabled}`));
  return buttons;
}

/** Loga a URL atual e título da página. */
async function logPageInfo(page: Page, label: string) {
  console.log(`  🌐 [${label}] URL: ${page.url()}`);
  console.log(`  📄 [${label}] Title: ${await page.title()}`);
}

// ─── Testes ─────────────────────────────────────────────────────────────────

test.describe('99food — Fluxo E2E headed (diagnóstico)', () => {
  test.setTimeout(180_000); // 3 min — margem generosa para debug

  test('Fluxo completo: localizador → código → resultado', async ({ browser }) => {
    // ── 1. Criar contexto e página (mesmo setup do browser.service) ─────
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('  99food Confirmer — Teste E2E de diagnóstico');
    console.log('══════════════════════════════════════════════════════════\n');

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
    });

    // Anti-detecção (igual ao browser.service)
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    page.setDefaultNavigationTimeout(30_000);

    // Captura logs do console da página alvo
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`  ❌ [PAGE CONSOLE] ${msg.text()}`);
      }
    });

    // Captura erros de rede
    page.on('response', (response) => {
      if (response.status() >= 400) {
        console.log(`  ⚠️  [REDE] ${response.status()} ${response.url().substring(0, 120)}`);
      }
    });

    try {
      // ── 2. Navegação ──────────────────────────────────────────────────
      const useDirectUrl = ORDER_ID && SHOP_ID;
      let targetUrl = BASE_URL;

      if (useDirectUrl) {
        targetUrl = `${BASE_URL}?orderId=${ORDER_ID}&locator=${LOCATOR}&shopId=${SHOP_ID}`;
        console.log('  🔗 Usando URL direta com query params');
      } else {
        console.log('  🔗 Usando URL base (fluxo manual com inputs)');
      }

      console.log(`\n── ETAPA 1: Navegação ─────────────────────────────────`);
      console.log(`  URL: ${targetUrl}`);

      const navigationResponse = await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      console.log(`  Status HTTP: ${navigationResponse?.status()}`);
      expect(navigationResponse?.status()).toBeLessThan(400);

      await logPageInfo(page, 'após goto');
      await snap(page, '01_apos_navegacao');

      // Pequena espera para a SPA hidratar
      await page.waitForTimeout(2000);
      await snap(page, '02_apos_hidratacao');

      // ── 3. Tela do localizador (8 inputs) ─────────────────────────────
      if (!useDirectUrl) {
        console.log(`\n── ETAPA 2: Tela do localizador (8 inputs) ────────────`);

        const inputState = await logInputState(page, 'tela inicial');
        await logButtons(page, 'tela inicial');

        // O service espera input[type="text"] — vamos verificar se existem
        const textInputCount = await page.locator('input[type="text"]').count();
        const telInputCount = await page.locator('input[type="tel"]').count();
        const numberInputCount = await page.locator('input[type="number"]').count();
        const allInputCount = await page.locator('input').count();

        console.log(`\n  📊 Breakdown de inputs:`);
        console.log(`     type="text":   ${textInputCount}`);
        console.log(`     type="tel":    ${telInputCount}`);
        console.log(`     type="number": ${numberInputCount}`);
        console.log(`     TOTAL <input>: ${allInputCount}`);

        // Determina qual seletor de input realmente funciona
        let inputSelector = 'input[type="text"]';
        if (textInputCount === 0 && telInputCount >= 8) {
          console.log(`  ⚠️  ATENÇÃO: Nenhum input[type="text"] encontrado! O service busca por type="text", mas a página tem type="tel".`);
          console.log(`  💡 SUGESTÃO: Alterar o seletor no service para input[type="tel"] ou usar input genérico.`);
          inputSelector = 'input[type="tel"]';
        } else if (textInputCount === 0 && telInputCount === 0 && numberInputCount >= 8) {
          console.log(`  ⚠️  ATENÇÃO: Inputs são type="number".`);
          inputSelector = 'input[type="number"]';
        } else if (textInputCount === 0) {
          console.log(`  ⚠️  ATENÇÃO: Nenhum input esperado encontrado. Dump da página:`);
          const bodyHTML = await page.locator('body').innerHTML();
          console.log(`     Body (primeiros 2000 chars): ${bodyHTML.substring(0, 2000)}`);
        }

        // Aguarda os inputs aparecerem com o seletor correto
        try {
          await page.waitForFunction(
            (sel: string) => document.querySelectorAll(sel).length >= 8,
            inputSelector,
            { timeout: 10_000 },
          );
          console.log(`  ✅ 8+ inputs encontrados com "${inputSelector}"`);
        } catch {
          console.log(`  ❌ FALHA: Não encontrou 8 inputs com "${inputSelector}" em 10s`);
          await snap(page, '02_FALHA_inputs_nao_encontrados');

          // Log do HTML completo para diagnóstico
          const html = await page.content();
          console.log(`  📄 HTML da página (primeiros 3000 chars):\n${html.substring(0, 3000)}`);
          throw new Error(`Esperava 8 inputs com "${inputSelector}", encontrou: text=${textInputCount}, tel=${telInputCount}, number=${numberInputCount}`);
        }

        await snap(page, '03_inputs_localizador_encontrados');

        // Preenche o localizador
        console.log(`\n  ✏️  Preenchendo localizador: ${LOCATOR}`);
        const inputs = page.locator(inputSelector);
        const count = await inputs.count();
        const digitos = LOCATOR.split('');

        for (let i = 0; i < Math.min(count, 8); i++) {
          await inputs.nth(i).fill(digitos[i]);
          // Micro delay para SPAs que atualizam estado entre inputs
          await page.waitForTimeout(100);
        }

        await snap(page, '04_localizador_preenchido');
        console.log(`  ✅ Localizador preenchido`);

        // Clica em "Verificar e continuar"
        console.log(`\n  🔘 Buscando botão "Verificar e continuar"...`);
        await logButtons(page, 'após preencher localizador');

        // Tenta o seletor exato do service primeiro
        let botaoContinuar = page.locator('button, [type="button"]')
          .filter({ hasText: /Verificar e continuar/i })
          .first();
        let botaoVisivel = await botaoContinuar.isVisible().catch(() => false);

        if (!botaoVisivel) {
          console.log(`  ⚠️  Botão "Verificar e continuar" não encontrado com o seletor do service.`);
          console.log(`  🔍 Tentando seletores alternativos...`);

          // Tenta variações comuns
          const alternativas = [
            { sel: 'button:has-text("continuar")', desc: 'button com "continuar"' },
            { sel: 'button:has-text("verificar")', desc: 'button com "verificar"' },
            { sel: '[role="button"]:has-text("continuar")', desc: 'role=button com "continuar"' },
            { sel: 'button >> nth=0', desc: 'primeiro button' },
          ];

          for (const alt of alternativas) {
            const candidato = page.locator(alt.sel).first();
            const vis = await candidato.isVisible().catch(() => false);
            const txt = vis ? await candidato.textContent().catch(() => '') : '';
            console.log(`     ${vis ? '✅' : '❌'} ${alt.desc}: "${txt}"`);
            if (vis && !botaoVisivel) {
              botaoContinuar = candidato;
              botaoVisivel = true;
            }
          }
        }

        expect(botaoVisivel, 'Botão "Verificar e continuar" deve estar visível').toBe(true);

        await botaoContinuar.click({ timeout: 10_000 });
        console.log(`  ✅ Botão clicado`);
        await snap(page, '05_apos_clicar_verificar');

        // Espera a transição da tela
        await page.waitForTimeout(2000);
        await snap(page, '06_transicao_aguardada');
      }

      // ── 4. Tela do código de segurança (4 inputs) ─────────────────────
      console.log(`\n── ETAPA 3: Tela do código de segurança (4 inputs) ────`);
      await logInputState(page, 'tela código');
      await logButtons(page, 'tela código');

      // Verifica qual tipo de input está na tela agora
      const textInputs4 = await page.locator('input[type="text"]').count();
      const telInputs4 = await page.locator('input[type="tel"]').count();
      const numberInputs4 = await page.locator('input[type="number"]').count();
      const allInputs4 = await page.locator('input').count();

      console.log(`\n  📊 Breakdown de inputs (tela código):`);
      console.log(`     type="text":   ${textInputs4}`);
      console.log(`     type="tel":    ${telInputs4}`);
      console.log(`     type="number": ${numberInputs4}`);
      console.log(`     TOTAL <input>: ${allInputs4}`);

      let codeInputSelector = 'input[type="text"]';
      if (textInputs4 === 0 && telInputs4 >= 4) {
        console.log(`  ⚠️  ATENÇÃO: Inputs de código são type="tel", não type="text" como o service espera.`);
        codeInputSelector = 'input[type="tel"]';
      } else if (textInputs4 === 0 && numberInputs4 >= 4) {
        codeInputSelector = 'input[type="number"]';
      }

      try {
        await page.waitForFunction(
          (sel: string) => document.querySelectorAll(sel).length >= 4,
          codeInputSelector,
          { timeout: 10_000 },
        );
        console.log(`  ✅ 4+ inputs de código encontrados com "${codeInputSelector}"`);
      } catch {
        console.log(`  ❌ FALHA: Não encontrou 4 inputs de código em 10s`);
        await snap(page, '07_FALHA_inputs_codigo');

        // Faz dump de tudo que está na página
        const pageText = await page.locator('body').innerText().catch(() => 'N/A');
        console.log(`  📄 Texto da página:\n${pageText.substring(0, 2000)}`);
        throw new Error(`Esperava 4 inputs de código com "${codeInputSelector}"`);
      }

      await snap(page, '07_inputs_codigo_encontrados');

      // Preenche o código
      console.log(`\n  ✏️  Preenchendo código: ${CODE}`);
      const inputsCodigo = page.locator(codeInputSelector);
      const codeDigits = CODE.split('');

      for (let i = 0; i < 4; i++) {
        await inputsCodigo.nth(i).fill(codeDigits[i]);
        await page.waitForTimeout(100);
      }

      await snap(page, '08_codigo_preenchido');
      console.log(`  ✅ Código preenchido`);

      // ── 5. Clica em "Concluir a entrega" ──────────────────────────────
      console.log(`\n── ETAPA 4: Botão "Concluir a entrega" ────────────────`);
      await logButtons(page, 'após preencher código');

      let botaoFinal = page.locator('button, [type="button"]')
        .filter({ hasText: /Concluir a entrega/i })
        .first();
      let botaoFinalVisivel = await botaoFinal.isVisible().catch(() => false);

      if (!botaoFinalVisivel) {
        console.log(`  ⚠️  Botão "Concluir a entrega" não encontrado com o seletor do service.`);

        const alternativas = [
          { sel: 'button:has-text("concluir")', desc: 'button com "concluir"' },
          { sel: 'button:has-text("confirmar")', desc: 'button com "confirmar"' },
          { sel: 'button:has-text("enviar")', desc: 'button com "enviar"' },
          { sel: '[role="button"]:has-text("concluir")', desc: 'role=button com "concluir"' },
        ];

        for (const alt of alternativas) {
          const candidato = page.locator(alt.sel).first();
          const vis = await candidato.isVisible().catch(() => false);
          const txt = vis ? await candidato.textContent().catch(() => '') : '';
          console.log(`     ${vis ? '✅' : '❌'} ${alt.desc}: "${txt}"`);
          if (vis && !botaoFinalVisivel) {
            botaoFinal = candidato;
            botaoFinalVisivel = true;
          }
        }
      }

      expect(botaoFinalVisivel, 'Botão "Concluir a entrega" deve estar visível').toBe(true);

      await botaoFinal.click({ timeout: 10_000 });
      console.log(`  ✅ Botão "Concluir a entrega" clicado`);
      await snap(page, '09_apos_concluir');

      // ── 6. Aguarda resultado (modal ActionSheet ou mudança de tela) ────
      console.log(`\n── ETAPA 5: Aguardando resultado ──────────────────────`);
      await page.waitForTimeout(3000);
      await snap(page, '10_aguardando_resultado');

      // Tenta detectar o modal que o service espera
      const seletoresResultado = [
        '[class*="ActionSheet__container"]',
        '[class*="ActionSheet"]',
        '[class*="action-sheet"]',
        '[class*="modal"]',
        '[class*="dialog"]',
        '[class*="result"]',
        '[class*="success"]',
        '[class*="error"]',
      ];

      console.log(`\n  🔍 Procurando indicadores de resultado:`);
      for (const sel of seletoresResultado) {
        const encontrado = await page.locator(sel).first().isVisible().catch(() => false);
        if (encontrado) {
          const texto = await page.locator(sel).first().innerText().catch(() => '');
          console.log(`     ✅ "${sel}" — texto: "${texto.substring(0, 100)}"`);
        } else {
          console.log(`     ❌ "${sel}"`);
        }
      }

      // ── 7. Captura de textos (scrapeVisibleTexts) ─────────────────────
      console.log(`\n── ETAPA 6: Captura de textos (scrapeVisibleTexts) ────`);

      // Reproduz a lógica do dom-scraper.ts
      const containerSelector = '[class*="page-container"]';
      const containerExiste = await page.locator(containerSelector).first().isVisible().catch(() => false);
      console.log(`  Container "${containerSelector}" existe: ${containerExiste}`);

      if (!containerExiste) {
        console.log(`  ⚠️  Container não encontrado! O scrapeVisibleTexts vai usar fallback (document inteiro).`);
        console.log(`  🔍 Classes presentes no body:`);

        const classes = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('[class]'));
          const classSet = new Set<string>();
          els.forEach(el => {
            (el as HTMLElement).className.split(/\s+/).forEach(c => {
              if (c.length > 3) classSet.add(c);
            });
          });
          return Array.from(classSet).sort().slice(0, 50);
        });
        console.log(`     ${classes.join(', ')}`);
      }

      const textosCapturados = await page.evaluate((selector) => {
        let raizes: (Document | Element)[] = selector ? Array.from(document.querySelectorAll(selector)) : [document];
        if (raizes.length === 0) raizes = [document];

        const elementosFilhos: Element[] = [];
        raizes.forEach(raiz => {
          elementosFilhos.push(...Array.from(raiz.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,strong,b,em,i')));
        });

        return elementosFilhos
          .filter(el => {
            const texto = el.textContent?.trim();
            const htmlEl = el as HTMLElement;
            const style = window.getComputedStyle(el);
            return Boolean(
              texto &&
              texto.length > 2 &&
              texto.length < 500 &&
              style.display !== 'none' &&
              htmlEl.offsetHeight > 0 &&
              !texto.includes('undefined'),
            );
          })
          .map(el => ({
            tag: el.tagName.toLowerCase(),
            texto: el.textContent?.trim() ?? '',
            classes: (el as HTMLElement).className,
            isHeading: el.tagName.match(/^H[1-6]$/) !== null,
          }))
          .filter((item, index, arr) => arr.findIndex(i => i.texto === item.texto) === index)
          .sort((a, b) => {
            if (a.isHeading && !b.isHeading) return -1;
            if (!a.isHeading && b.isHeading) return 1;
            return (a.texto?.length || 0) - (b.texto?.length || 0);
          });
      }, containerExiste ? containerSelector : null);

      console.log(`\n  📝 Textos capturados (${textosCapturados.length}):`);
      textosCapturados.forEach((t, i) => {
        console.log(`     ${i + 1}. [${t.tag}] ${t.isHeading ? '📌 ' : ''}${t.texto.substring(0, 120)}`);
      });

      await snap(page, '11_resultado_final');

      // ── 8. Resumo de diagnóstico ──────────────────────────────────────
      console.log(`\n══════════════════════════════════════════════════════════`);
      console.log(`  📋 RESUMO DE DIAGNÓSTICO`);
      console.log(`══════════════════════════════════════════════════════════`);
      console.log(`  URL final:       ${page.url()}`);
      console.log(`  Textos capturados: ${textosCapturados.length}`);
      console.log(`  Container alvo:  ${containerExiste ? '✅ encontrado' : '❌ NÃO encontrado'}`);
      console.log(`══════════════════════════════════════════════════════════\n`);

      // Assertion mínima — o teste deve ao menos completar o fluxo sem crash
      expect(textosCapturados.length).toBeGreaterThanOrEqual(0);

    } finally {
      await context.close();
    }
  });

  // ── Teste isolado: somente URL direta (com query params) ──────────────
  test('URL direta: navega com orderId + locator + shopId', async ({ browser }) => {
    test.skip(!ORDER_ID || !SHOP_ID, 'Defina TEST_ORDER_ID e TEST_SHOP_ID para rodar este teste');

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const page = await context.newPage();

    try {
      const directUrl = `${BASE_URL}?orderId=${ORDER_ID}&locator=${LOCATOR}&shopId=${SHOP_ID}`;
      console.log(`\n  🔗 Navegando para URL direta: ${directUrl}`);

      await page.goto(directUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      await logPageInfo(page, 'URL direta');
      await logInputState(page, 'URL direta');
      await logButtons(page, 'URL direta');
      await snap(page, 'direct_01_apos_navegacao');

      // Com URL direta, devemos cair direto na tela de código (4 inputs)
      const textInputs = await page.locator('input[type="text"]').count();
      const telInputs = await page.locator('input[type="tel"]').count();

      console.log(`\n  📊 Inputs na tela (esperamos 4 para código):`);
      console.log(`     type="text": ${textInputs}`);
      console.log(`     type="tel":  ${telInputs}`);

      if (textInputs !== 4 && telInputs !== 4) {
        console.log(`  ⚠️  A URL direta não levou para a tela de código como esperado.`);
        const bodyText = await page.locator('body').innerText().catch(() => '');
        console.log(`  📄 Texto da página:\n${bodyText.substring(0, 1500)}`);
      }

      await snap(page, 'direct_02_estado_final');
    } finally {
      await context.close();
    }
  });
});
