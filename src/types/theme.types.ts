// Request Types
export interface ThemeDownloadRequest {
  theme_id: string;
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
  theme_id?: string;
  env_id?: string;
  error?: string;
}

// Chat Types
export interface ChatRequest {
  env_id: string;
  prompt: string;
  model?: string;
}

export interface ChatStreamingRequest {
  env_id: string;
  prompt: string;
  model?: string;
}

export interface ChatWebhookPayload {
  success: boolean;
  env_id?: string;
  response?: string;
  items?: any[];
  error?: string;
}

export interface ChatStreamingWebhookPayload {
  success: boolean;
  env_id?: string;
  event_number?: number;
  timestamp?: string;
  type?: string;        // Event type: thread.started, turn.started, item.updated, etc.
  thread_id?: string;   // For thread.started events
  item?: any;           // For item.* events (item.started, item.updated, item.completed)
  usage?: any;          // For turn.completed events
  error?: any;          // For turn.failed and error events
  message?: string;     // For error events
  [key: string]: any;   // Other dynamic event properties
}
