/**
 * Unified API layer — routes calls to demo stubs or the real FastAPI backend
 * depending on the NEXT_PUBLIC_DEMO_MODE environment variable.
 */

import { isDemoMode } from './config';
import * as demoApi from './demo/api';
import * as realApi from './real-api';

// Re-export all types so existing imports keep working
export type {
  TokenResponse,
  ChatMessage,
  ChatResponse,
  UserProfile,
  ConversationSummary,
  UsageStats,
  SubscriptionStatus,
} from './real-api';

export { ApiError } from './real-api';

export const authApi = isDemoMode ? demoApi.authApi : realApi.authApi;
export const chatApi = isDemoMode ? demoApi.chatApi : realApi.chatApi;
export const billingApi = isDemoMode ? demoApi.billingApi : realApi.billingApi;
