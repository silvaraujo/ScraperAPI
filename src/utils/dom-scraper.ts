import { Page } from 'playwright';

export interface ExtractedText {
  tag: string;
  texto: string;
  classes: string;
  isHeading: boolean;
}

/**
 * Captures all visible text from a specified container (or the entire page).
 * Removes duplicates and prioritizes headings.
 * @param page Playwright Page instance
 * @param containerSelector Optional CSS selector to restrict scraping to a specific container (e.g., a modal)
 */
export async function scrapeVisibleTexts(page: Page, containerSelector?: string): Promise<ExtractedText[]> {
  return page.evaluate((selector) => {
    // Foca em todos os containers que correspondem ao seletor (útil se houver múltiplos modais na DOM)
    let raizes: (Document | Element)[] = selector ? Array.from(document.querySelectorAll(selector)) : [document];
    
    // Se o seletor foi passado mas nenhum elemento foi encontrado, usa o document inteiro como fallback
    if (raizes.length === 0) {
      raizes = [document];
    }

    const elementosFilhos: Element[] = [];
    raizes.forEach(raiz => {
      elementosFilhos.push(...Array.from(raiz.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,strong,b,em,i')));
    });

    const elementos = elementosFilhos.filter(el => {
      const texto = el.textContent?.trim();
      const htmlEl = el as HTMLElement;
      const style = window.getComputedStyle(el);

      return Boolean(
             texto &&
             texto.length > 2 &&
             texto.length < 500 &&
             style.display !== 'none' &&
             htmlEl.offsetHeight > 0 &&
             !texto.includes('undefined')
      );
    }).map(el => {
      const htmlEl = el as HTMLElement;
      return {
        tag: el.tagName.toLowerCase(),
        texto: el.textContent?.trim() ?? '',
        classes: htmlEl.className,
        isHeading: el.tagName.match(/^H[1-6]$/) !== null,
      };
    });

    // Remove duplicatas e prioriza headings
    return elementos
      .filter((item, index, arr) => arr.findIndex(i => i.texto === item.texto) === index)
      .sort((a, b) => {
        if (a.isHeading && !b.isHeading) return -1;
        if (!a.isHeading && b.isHeading) return 1;
        return (a.texto?.length || 0) - (b.texto?.length || 0);
      });
  }, containerSelector);
}
