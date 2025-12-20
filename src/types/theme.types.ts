// Request Types
export interface ThemeDownloadRequest {
  theme_name: string;
}

// Response Types
export interface StandardAPIResponse {
  success: boolean;
  message: string;
  data?: Record<string, any>;
}

export interface ThemeInfo {
  name: string;
  id: string;
  role: string;
}

// Webhook Payload Types
export interface ThemeListWebhookPayload {
  success: boolean;
  themes: ThemeInfo[];
  error?: string;
}

export interface ThemeDownloadWebhookPayload {
  success: boolean;
  theme_name: string;
  download_path?: string;
  error?: string;
}
