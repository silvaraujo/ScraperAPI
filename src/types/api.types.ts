export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta: {
    count?: number;
    durationMs: number;
    targetUrl?: string;
    timestamp: string;
    buttonText?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  meta: {
    durationMs: number;
    timestamp: string;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  uptime: number;
  environment: string;
  timestamp: string;
}
