/**
 * NexaBase API client — wraps all calls to the FastAPI backend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    const message =
      typeof detail === "object" && detail !== null && "detail" in detail
        ? String((detail as { detail: unknown }).detail)
        : `HTTP ${res.status}`;
    throw new ApiError(res.status, message, detail);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  tier: "free" | "pro";
}

export const authApi = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    request<TokenResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: (token: string) =>
    request<UserProfile>("/api/v1/auth/me", { token }),
};

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  reply: string;
  conversation_id: string;
  tokens_used: number;
  messages_used: number;
  messages_limit: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  tier: "free" | "pro";
  messages_used: number;
  messages_limit: number;
  stripe_customer_id?: string;
  created_at: string;
}

export const chatApi = {
  send: (
    data: { message: string; conversation_id?: string; history?: ChatMessage[] },
    token: string
  ) =>
    request<ChatResponse>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  getConversations: (token: string) =>
    request<{ conversations: ConversationSummary[] }>(
      "/api/v1/chat/conversations",
      { token }
    ),

  getMessages: (conversationId: string, token: string) =>
    request<{ messages: ChatMessage[] }>(
      `/api/v1/chat/conversations/${conversationId}`,
      { token }
    ),

  getUsage: (token: string) =>
    request<UsageStats>("/api/v1/chat/usage", { token }),
};

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  messages_used: number;
  messages_limit: number;
  messages_remaining: number;
  tier: "free" | "pro";
}

// ── Billing ───────────────────────────────────────────────────────────────────

export const billingApi = {
  createCheckout: (
    data: { price_id: string; success_url: string; cancel_url: string },
    token: string
  ) =>
    request<{ checkout_url: string; session_id: string }>(
      "/api/v1/billing/checkout",
      { method: "POST", body: JSON.stringify(data), token }
    ),

  createPortal: (data: { return_url: string }, token: string) =>
    request<{ portal_url: string }>("/api/v1/billing/portal", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  getSubscription: (token: string) =>
    request<SubscriptionStatus>("/api/v1/billing/subscription", { token }),
};

export interface SubscriptionStatus {
  tier: "free" | "pro";
  status: string;
  current_period_end?: number;
  cancel_at_period_end: boolean;
}
