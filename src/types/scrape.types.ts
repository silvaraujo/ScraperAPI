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

// Button Check Types
export interface ButtonElement {
  text: string;
  type: string;
  id: string;
  name?: string;
  visible: boolean;
  enabled: boolean;
}

export interface InputElement {
  type: string;
  name: string;
  id: string;
  placeholder: string;
  value: string;
  required: boolean;
  visible: boolean;
}

export interface FormElement {
  id: string;
  action: string;
  method: string;
  inputCount: number;
}

export interface HeadingElement {
  tag: string;
  text: string;
}

export interface PageAnalysis {
  inputCount: number;
  buttonCount: number;
  formCount: number;
  headingCount: number;
}

export interface PageDetails {
  inputs: InputElement[];
  buttons: ButtonElement[];
  forms: FormElement[];
  headings: HeadingElement[];
}

export interface ButtonCheckResult {
  success: boolean;
  buttonFound: boolean;
  pageUrl: string;
  pageTitle?: string;
  targetButton?: ButtonElement;
  analysis?: PageAnalysis;
  details?: PageDetails;
  error?: string;
  timestamp: string;
}
