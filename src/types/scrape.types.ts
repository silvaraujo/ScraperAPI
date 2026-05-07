export type ScrapeTarget = 'test-sites' | 'ecommerce';

export interface ScrapeSite {
  title: string;
  description?: string;
  url: string;
}

export interface Product {
  title: string;
  price?: string;
  description?: string;
  rating?: string;
  url?: string;
}

export interface ScrapeRunRequest {
  target: ScrapeTarget;
  limit?: number;
  headless?: boolean;
}

export interface SmokeTestCheck {
  name: string;
  passed: boolean;
  error?: string;
}

export interface SmokeTestResult {
  target: ScrapeTarget;
  passed: boolean;
  checks: SmokeTestCheck[];
  durationMs: number;
  timestamp: string;
}

export interface ScraperOptions {
  url: string;
  timeout?: number;
  headless?: boolean;
}
