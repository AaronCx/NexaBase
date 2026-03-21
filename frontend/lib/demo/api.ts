import { toast } from '@/hooks/useToast';
import {
  DEMO_CONVERSATIONS,
  DEMO_MESSAGES,
  DEMO_USAGE,
  DEMO_SUBSCRIPTION,
  DEMO_PROFILE,
} from './data';
import { DEMO_USER, DEMO_TOKEN } from './auth';
import type {
  ChatResponse,
  ConversationSummary,
  ChatMessage,
  UsageStats,
  SubscriptionStatus,
  UserProfile,
  TokenResponse,
} from '@/lib/api';

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: async (): Promise<TokenResponse> => ({
    access_token: DEMO_TOKEN,
    token_type: 'bearer',
    user_id: DEMO_USER.id,
    email: DEMO_USER.email,
    tier: 'pro',
  }),

  login: async (): Promise<TokenResponse> => ({
    access_token: DEMO_TOKEN,
    token_type: 'bearer',
    user_id: DEMO_USER.id,
    email: DEMO_USER.email,
    tier: 'pro',
  }),

  me: async (): Promise<UserProfile> => ({
    id: DEMO_USER.id,
    email: DEMO_USER.email,
    full_name: DEMO_USER.name,
    tier: 'pro',
    messages_used: DEMO_USER.messages_used_this_month,
    messages_limit: DEMO_USER.monthly_message_limit,
    stripe_customer_id: undefined,
    created_at: DEMO_USER.created_at,
  }),
};

// ── Chat ─────────────────────────────────────────────────────────────────────

let demoMessageCount = DEMO_USAGE.messages_used;

export const chatApi = {
  send: async (
    data: { message: string; conversation_id?: string; history?: ChatMessage[] },
  ): Promise<ChatResponse> => {
    // Check if OpenAI API route is available (live AI mode)
    const useOpenAI = !!process.env.NEXT_PUBLIC_OPENAI_ENABLED;

    if (useOpenAI) {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: data.message,
            conversationHistory: data.history ?? [],
          }),
        });
        if (res.ok) {
          const json = await res.json();
          demoMessageCount++;
          return {
            reply: json.reply,
            conversation_id: data.conversation_id ?? 'demo-live-conv',
            tokens_used: 0,
            messages_used: demoMessageCount,
            messages_limit: DEMO_USAGE.messages_limit,
          };
        }
      } catch {
        // Fall through to static response
      }
    }

    // Static demo response
    await new Promise((resolve) => setTimeout(resolve, 500));
    demoMessageCount++;
    return {
      reply: `Thanks for trying NexaBase! This is a demo response.\n\nIn the full version, this would be powered by GPT-4o mini with conversation history and context awareness.\n\nYou asked: "${data.message.slice(0, 100)}${data.message.length > 100 ? '...' : ''}"`,
      conversation_id: data.conversation_id ?? 'demo-new-conv',
      tokens_used: 0,
      messages_used: demoMessageCount,
      messages_limit: DEMO_USAGE.messages_limit,
    };
  },

  getConversations: async (): Promise<{ conversations: ConversationSummary[] }> => ({
    conversations: DEMO_CONVERSATIONS,
  }),

  getMessages: async (conversationId: string): Promise<{ messages: ChatMessage[] }> => ({
    messages: DEMO_MESSAGES[conversationId] ?? [],
  }),

  getUsage: async (): Promise<UsageStats> => DEMO_USAGE,
};

// ── Billing ──────────────────────────────────────────────────────────────────

export const billingApi = {
  createCheckout: async (): Promise<{ checkout_url: string; session_id: string }> => {
    toast({
      title: 'Demo mode',
      description: 'Billing is disabled in demo mode.',
    });
    return { checkout_url: '', session_id: '' };
  },

  createPortal: async (): Promise<{ portal_url: string }> => {
    toast({
      title: 'Demo mode',
      description: 'Billing is disabled in demo mode.',
    });
    return { portal_url: '' };
  },

  getSubscription: async (): Promise<SubscriptionStatus> => DEMO_SUBSCRIPTION,
};

// ── Profile helper (for server-side pages in demo mode) ──────────────────────

export function getDemoProfile() {
  return DEMO_PROFILE;
}
