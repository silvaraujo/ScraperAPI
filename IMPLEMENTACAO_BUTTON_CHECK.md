# 📋 Implementação de Button Check API - Documentação Completa

## 📌 Visão Geral

Este documento explica a implementação de um novo recurso de **verificação de botões em páginas via API** usando a arquitetura existente do projeto. A solução segue o padrão **arquitetural em camadas** utilizado no projeto, permitindo que este recurso seja escalável e mantenível.

---

## 🏗️ Arquitetura do Projeto (Padrão em Camadas)

O projeto utiliza o padrão **MVC com separação de responsabilidades**:

```
REQUEST HTTP
    ↓
ROUTES (Define endpoints)
    ↓
CONTROLLER (Recebe requisição, valida, chama service)
    ↓
SCHEMA (Valida dados de entrada com Zod)
    ↓
SERVICE (Lógica de negócio, executa com Playwright)
    ↓
TYPES (Define interfaces TypeScript)
    ↓
RESPONSE HTTP
```

### Por que essa arquitetura?
- ✅ **Separação de responsabilidades**: Cada camada tem um propósito específico
- ✅ **Testabilidade**: Fácil testar cada camada independentemente
- ✅ **Manutenibilidade**: Mudanças em uma camada não afetam as outras
- ✅ **Reusabilidade**: Services podem ser chamados de diferentes controllers
- ✅ **Escalabilidade**: Fácil adicionar novos recursos seguindo o mesmo padrão

---

## 📁 Arquivos Criados e Modificados

### 1️⃣ **TYPES** - [src/types/scrape.types.ts](src/types/scrape.types.ts)

**O que foi feito:** Adicionadas interfaces TypeScript para descrever os dados

**Interfaces criadas:**

```typescript
// Representa um elemento de botão encontrado na página
interface ButtonElement {
  text: string;        // Texto exibido no botão
  type: string;        // Tipo: button, submit, etc
  id: string;          // ID do elemento
  name?: string;       // Nome do atributo name
  visible: boolean;    // Se está visível na tela
  enabled: boolean;    // Se está habilitado
}

// Representa um elemento input encontrado
interface InputElement {
  type: string;        // Tipo: text, email, password, etc
  name: string;        // Nome do input
  id: string;          // ID do input
  placeholder: string; // Texto placeholder
  value: string;       // Valor atual
  required: boolean;   // Se é obrigatório
  visible: boolean;    // Se está visível
}

// Resultado final da análise
interface ButtonCheckResult {
  success: boolean;           // Se a operação foi bem-sucedida
  buttonFound: boolean;       // Se o botão foi encontrado
  pageUrl: string;            // URL analisada
  pageTitle?: string;         // Título da página
  targetButton?: ButtonElement; // Dados do botão encontrado
  analysis?: PageAnalysis;    // Estatísticas da página
  details?: PageDetails;      // Detalhes completos dos elementos
  error?: string;             // Mensagem de erro se houver
  timestamp: string;          // Data/hora da análise
}
```

**Por que fazer isso?**
- Garante **type safety** em todo o projeto
- O TypeScript valida os dados em tempo de compilação
- Autocompletar funciona em IDEs (melhor experiência do desenvolvedor)
- Serve como documentação do que a API retorna

---

### 2️⃣ **SCHEMA** - [src/schemas/button-check.schema.ts](src/schemas/button-check.schema.ts)

**O que foi feito:** Criado schema de validação para requisições

```typescript
export const buttonCheckRequestSchema = z.object({
  pageUrl: z.string().url('URL inválida'),
  buttonText: z.string().min(1, 'Texto do botão é obrigatório'),
});
```

**Por que fazer isso?**
- **Validação em tempo de execução**: Não confia que o cliente enviará dados corretos
- **Mensagens de erro claras**: Usuário sabe exatamente o que está errado
- **Segurança**: Previne ataques com dados malformados
- **Zod**: Biblioteca que valida em runtime E gera tipos TypeScript automaticamente

**Exemplo de erro que evita:**
```json
// ❌ Sem schema - requisição inválida passa
{
  "pageUrl": "não é uma url",
  "buttonText": ""
}

// ✅ Com schema - erro é retornado
{
  "success": false,
  "error": "URL inválida"
}
```

---

### 3️⃣ **SERVICE** - [src/services/button-check.service.ts](src/services/button-check.service.ts)

**O que foi feito:** Criada a lógica principal usando Playwright

**Responsabilidades:**

```typescript
export class ButtonCheckService {
  async verifyButtonOnPage(pageUrl: string, buttonText: string): Promise<ButtonCheckResult> {
    // 1. Inicializa browser
    // 2. Cria página
    // 3. Navega até a URL
    // 4. Executa JavaScript na página para buscar elementos
    // 5. Retorna análise completa
    // 6. Limpa recursos (fecha página)
  }
}
```

**Por que uma classe Service?**
- Encapsula toda lógica de negócio
- Pode ser **instanciada uma única vez** (`buttonCheckService = new ButtonCheckService()`)
- Reutilizável em diferentes contextos (CLI, API, testes)
- Facilita testes unitários

**O que o service faz em detalhe:**

```
1. INICIALIZA BROWSER
   └─ await browserService.initialize();
      (Reutiliza browser existente ou cria novo)

2. CRIA PÁGINA
   └─ const page = await browserService.createPage();
      (Cada página é um tab isolado)

3. NAVEGA PARA URL
   └─ await page.goto(pageUrl, { waitUntil: 'networkidle' });
      (Aguarda recursos carregarem)

4. EXECUTA JAVASCRIPT NA PÁGINA
   └─ await page.evaluate((searchText) => {
        // Busca botão com texto que contém searchText
        // Coleta todos inputs
        // Coleta todos forms
        // Coleta todos headings
        // Retorna dados estruturados
      });

5. PROCESSA RESULTADO
   └─ Retorna ButtonCheckResult com success=true

6. TRATAMENTO DE ERROS
   └─ Se algo falhar, retorna success=false com erro

7. LIMPA RECURSOS
   └─ Fecha página com page.close()
      (Evita vazamento de memória)
```

**Por que usar `page.evaluate()`?**
- Executa JavaScript **dentro do contexto do navegador**
- Acesso direto ao DOM
- Pode acessar `document`, `window`, etc
- Muito mais rápido que selecionar elemento por elemento

---

### 4️⃣ **CONTROLLER** - [src/controllers/button-check.controller.ts](src/controllers/button-check.controller.ts)

**O que foi feito:** Criado endpoint que recebe requisições HTTP

```typescript
export const postButtonCheck = asyncHandler(async (req: Request, res: Response) => {
  // 1. Valida dados com schema
  // 2. Se inválido, lança erro
  // 3. Se válido, extrai dados
  // 4. Chama service
  // 5. Retorna resposta formatada
});
```

**Fluxo da requisição:**

```
REQUEST POST /api/button-check/verify
{
  "pageUrl": "https://...",
  "buttonText": "Cheguei no local"
}
    ↓
CONTROLLER recebe
    ↓
Valida com schema (buttonCheckRequestSchema)
    ↓
Se ERRO → Retorna 400
  "errors": ["URL inválida", ...]
    ↓
Se OK → Extrai dados
{
  pageUrl: "https://...",
  buttonText: "Cheguei no local"
}
    ↓
Chama buttonCheckService.verifyButtonOnPage(pageUrl, buttonText)
    ↓
Aguarda resultado (pode levar 5-30 segundos)
    ↓
Formata resposta com buildResponse.success()
    ↓
Retorna 200 + dados
```

**Por que usar `asyncHandler`?**
- Wrapper que **captura erros automaticamente**
- Se uma promise rejeitar, passa para middleware de erro
- Evita try/catch em todo lugar

```typescript
// ❌ Sem asyncHandler
app.post('/api/test', async (req, res) => {
  try {
    const result = await service.doSomething();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
});

// ✅ Com asyncHandler
app.post('/api/test', asyncHandler(async (req, res) => {
  const result = await service.doSomething();
  res.json(result); // Erros são capturados automaticamente
}));
```

---

### 5️⃣ **ROUTES** - [src/routes/button-check.routes.ts](src/routes/button-check.routes.ts)

**O que foi feito:** Definidas rotas HTTP do novo recurso

```typescript
router.post('/verify', postButtonCheck);
```

**Documentação Swagger incluída:**

```typescript
/**
 * @swagger
 * /api/button-check/verify:
 *   post:
 *     summary: Verify if a button exists on a page
 *     tags:
 *       - Button Check
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pageUrl:
 *                 type: string
 *                 format: uri
 *               buttonText:
 *                 type: string
 */
```

**Por que documentar com Swagger?**
- Documentação vive no código (não fica desatualizada)
- Gera automaticamente `/docs` interface interativa
- Clientes sabem exatamente como chamar a API
- Swagger UI permite testar direto no navegador

---

### 6️⃣ **APP.TS** - [src/app.ts](src/app.ts)

**O que foi feito:** Registradas novas rotas na aplicação

```typescript
// 1. Importar router
import buttonCheckRoutes from './routes/button-check.routes';

// 2. Registrar na aplicação
app.use('/api/button-check', buttonCheckRoutes);
```

**Por que registrar aqui?**
- Ponto central onde **todas as rotas são registradas**
- Ordem importa: middlewares acima afetam rotas abaixo
- Fácil ver todos os endpoints da aplicação

**Ordem das rotas em app.ts:**
```
1. Middlewares de segurança
2. Middlewares de logging
3. Rotas públicas
4. Todas as rotas API (scrape, button-check, etc)
5. 404 handler
6. Error handler (SEMPRE por último)
```

---

### 7️⃣ **TESTES E2E** - [tests/e2e/button-check.spec.ts](tests/e2e/button-check.spec.ts)

**O que foi feito:** Testes Playwright para validar a API

**Tipos de testes:**

| Teste | Objetivo | Por quê? |
|-------|----------|---------|
| `should detect button on page` | Sucesso na detecção | Valida fluxo principal |
| `should return error for invalid URL` | Validação de entrada | Testa robustez |
| `should return error when buttonText is empty` | Validação de entrada | Testa validação Zod |
| `should analyze page and return details` | Análise completa | Testa estrutura de resposta |
| `should validate button visibility` | Estado do botão | Testa dados precisos |
| `should handle pages with multiple buttons` | Múltiplos cenários | Testa escalabilidade |

**Exemplo de teste:**

```typescript
test('should detect button on page', async ({ request }) => {
  // 1. ARRANGE - Prepara dados
  const response = await request.post('/api/button-check/verify', {
    data: {
      pageUrl: 'https://confirmacao-entrega-propria.ifood.com.br',
      buttonText: 'Cheguei no local',
    },
  });

  // 2. ACT - Executa ação (já foi feita acima)

  // 3. ASSERT - Valida resultado
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.data.buttonFound).toBeDefined();
});
```

**Por que testes E2E?**
- Testa API **como cliente real** a usaria
- Valida todo fluxo: HTTP → Controller → Service → Browser → Resposta
- Catch bugs que unit tests não pegam
- Timeout de 120s para operações de scraping (pode ser lento)

---

## 🔄 Fluxo Completo de uma Requisição

```
1. CLIENTE faz requisição
   └─ POST /api/button-check/verify
   └─ Payload: { pageUrl, buttonText }

2. EXPRESS roteia para controller
   └─ App.ts vê /api/button-check → carrega button-check.routes.ts
   └─ button-check.routes.ts vê /verify → chama postButtonCheck

3. CONTROLLER recebe requisição
   └─ postButtonCheck(req, res)
   └─ Validação com schema
   └─ Se falhar → erro 400
   └─ Se passar → continua

4. CONTROLLER chama SERVICE
   └─ buttonCheckService.verifyButtonOnPage(pageUrl, buttonText)
   └─ Service inicializa browser
   └─ Service navega para URL
   └─ Service busca botão
   └─ Service retorna ButtonCheckResult

5. CONTROLLER formata resposta
   └─ buildResponse.success(res, result, 200, meta)
   └─ Retorna JSON

6. CLIENTE recebe resposta
   └─ { success: true, data: { buttonFound, ... }, meta: { ... } }
```

---

## 🎯 Por Que Essa Arquitetura é Boa para Production?

### ✅ Segurança
- Validação em duas camadas: Schema + lógica
- Timeouts evitam travamentos
- Tratamento de erros centralizado

### ✅ Performance
- Browser reutilizado entre requisições (singleton)
- Páginas isoladas (não interfere uma na outra)
- Logging centralizado para debug

### ✅ Manutenibilidade
- Fácil encontrar onde adicionar features
- Cada arquivo tem responsabilidade clara
- Mudanças não afetam outras partes

### ✅ Testabilidade
- Unit tests: Service pode ser testado isoladamente
- Integration tests: Controller + Service + Validação
- E2E tests: Testa como client real usa

### ✅ Escalabilidade
- Padrão pronto para duplicar para outros recursos
- Reutiliza middleware existente (auth, logging, rate-limit)
- Preparado para clustering (Node.js)

---

## 🔧 Como Replicar Esse Padrão para Outras Automações

Siga estes passos para criar um novo recurso:

### Passo 1: Defina os TIPOS
**Arquivo:** `src/types/seu-recurso.types.ts`

```typescript
export interface SeuDado {
  campo1: string;
  campo2: number;
}

export interface SeuResultado {
  success: boolean;
  data?: SeuDado;
  error?: string;
}
```

### Passo 2: Defina o SCHEMA de validação
**Arquivo:** `src/schemas/seu-recurso.schema.ts`

```typescript
import { z } from 'zod';

export const seuRequestSchema = z.object({
  campo1: z.string().min(1),
  campo2: z.number().positive(),
});

export type SeuRequest = z.infer<typeof seuRequestSchema>;
```

### Passo 3: Implemente a lógica no SERVICE
**Arquivo:** `src/services/seu-recurso.service.ts`

```typescript
export class SeuRecursoService {
  async executarLogica(input: SeuInput): Promise<SeuResultado> {
    try {
      // Sua lógica aqui
      const resultado = await fazerAlgo(input);
      return { success: true, data: resultado };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export const seuRecursoService = new SeuRecursoService();
```

### Passo 4: Crie o CONTROLLER
**Arquivo:** `src/controllers/seu-recurso.controller.ts`

```typescript
export const postSeuRecurso = asyncHandler(async (req, res) => {
  const parsed = seuRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new BadRequestError(JSON.stringify(parsed.error.errors));
  }

  const resultado = await seuRecursoService.executarLogica(parsed.data);
  return buildResponse.success(res, resultado, 200);
});
```

### Passo 5: Defina as ROUTES
**Arquivo:** `src/routes/seu-recurso.routes.ts`

```typescript
import { Router } from 'express';
import { postSeuRecurso } from '../controllers/seu-recurso.controller';

const router = Router();

/**
 * @swagger
 * /api/seu-recurso/executar:
 *   post:
 *     summary: Descrição do endpoint
 */
router.post('/executar', postSeuRecurso);

export default router;
```

### Passo 6: Registre no APP.TS
```typescript
import seuRecursoRoutes from './routes/seu-recurso.routes';

// Dentro de createApp()
app.use('/api/seu-recurso', seuRecursoRoutes);
```

### Passo 7: Teste com Playwright
**Arquivo:** `tests/e2e/seu-recurso.spec.ts`

```typescript
test('deve executar recurso', async ({ request }) => {
  const response = await request.post('/api/seu-recurso/executar', {
    data: { campo1: 'valor', campo2: 42 },
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
});
```

---

## 📊 Estrutura de Pastas (Padrão)

```
src/
├── types/
│   └── scrape.types.ts           ← Define interfaces
├── schemas/
│   └── button-check.schema.ts    ← Valida dados
├── services/
│   └── button-check.service.ts   ← Lógica de negócio
├── controllers/
│   └── button-check.controller.ts ← Recebe HTTP
├── routes/
│   └── button-check.routes.ts    ← Define endpoints
├── middlewares/                   ← Segurança, logging, etc
├── utils/                         ← Helpers
└── app.ts                         ← Registra rotas

tests/e2e/
└── button-check.spec.ts          ← Testes
```

---

## 🚀 Comandos Úteis

```bash
# Desenvolver
npm run dev                    # Inicia servidor com hot-reload
npm run typecheck             # Valida tipos TypeScript

# Testar
npm run test:e2e              # Roda todos testes E2E
npm run test:e2e -- button-check.spec.ts  # Testa apenas button-check
npm run test:headed           # Testes com interface visual

# Deploy
npm run build                 # Compila TypeScript
npm start                     # Executa versão compilada
npm run docker:compose        # Deploy com Docker
```

---

## 💡 Resumo: Por Que Cada Coisa Existe

| Arquivo | Razão | Benefício |
|---------|-------|----------|
| **Types** | TypeScript type-safety | Erros em tempo de compilação |
| **Schemas** | Validação runtime | Rejeita dados inválidos |
| **Services** | Lógica reutilizável | Pode ser usado em CLI, API, etc |
| **Controllers** | Ponto de entrada HTTP | Separa HTTP da lógica |
| **Routes** | Define endpoints | Organiza URLs |
| **App.ts** | Registra tudo | Ponto central |
| **Tests** | Valida funcionamento | Pega bugs automaticamente |

---

## 🎓 Conclusão

Essa arquitetura em camadas segue as melhores práticas da indústria:
- **SOLID principles**: Cada classe tem uma responsabilidade
- **Clean Code**: Fácil ler e entender código
- **Testability**: Tudo é testável
- **Production-ready**: Seguro, escalável, mantível

Use esse padrão como template para todas as automações futuras! 🚀
