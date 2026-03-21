export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@nexabase.app',
  name: 'Demo User',
  subscription_tier: 'pro' as const,
  messages_used_this_month: 27,
  monthly_message_limit: 5000,
  stripe_customer_id: null,
  created_at: '2025-12-01T00:00:00Z',
};

export const DEMO_TOKEN = 'demo-token';

export async function signIn() {
  return { user: DEMO_USER, token: DEMO_TOKEN };
}

export async function signUp() {
  return { user: DEMO_USER, token: DEMO_TOKEN };
}

export async function signOut() {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export async function getSession() {
  return {
    user: {
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      user_metadata: { full_name: DEMO_USER.name },
      created_at: DEMO_USER.created_at,
    },
    access_token: DEMO_TOKEN,
  };
}
