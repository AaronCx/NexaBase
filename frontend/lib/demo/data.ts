import type { ConversationSummary, UsageStats, SubscriptionStatus, ChatMessage } from '@/lib/api';

// ── Conversations ────────────────────────────────────────────────────────────

export const DEMO_CONVERSATIONS: ConversationSummary[] = [
  {
    id: 'conv-001',
    title: 'Build a React auth flow',
    created_at: '2026-03-18T09:15:00Z',
    updated_at: '2026-03-18T09:42:00Z',
  },
  {
    id: 'conv-002',
    title: 'Analyze Q4 revenue data',
    created_at: '2026-03-17T14:20:00Z',
    updated_at: '2026-03-17T14:55:00Z',
  },
  {
    id: 'conv-003',
    title: 'Write a product launch email',
    created_at: '2026-03-15T11:00:00Z',
    updated_at: '2026-03-15T11:30:00Z',
  },
  {
    id: 'conv-004',
    title: 'Explain async/await in Python',
    created_at: '2026-03-14T16:10:00Z',
    updated_at: '2026-03-14T16:25:00Z',
  },
];

// ── Messages per conversation ────────────────────────────────────────────────

export const DEMO_MESSAGES: Record<string, ChatMessage[]> = {
  'conv-001': [
    { role: 'user', content: 'I need to build a login and registration flow for a Next.js 14 app using the App Router. Can you help me design the architecture?' },
    { role: 'assistant', content: "Here's a solid architecture for auth in Next.js 14 App Router:\n\n## Key Components\n\n1. **Middleware** (`middleware.ts`) — intercepts requests to protected routes and redirects unauthenticated users\n2. **Auth API routes** (`app/api/auth/`) — handles login, register, and logout\n3. **Auth context/hook** — client-side state management for the current user\n4. **Server components** — use cookies to verify sessions server-side\n\n## Recommended Flow\n\n```\nUser → Login Form → API Route → Set HTTP-only cookie → Redirect to /dashboard\n```\n\nThe middleware checks the cookie on every request to protected routes. Server components can read the cookie directly via `cookies()` from `next/headers`.\n\nWant me to start with the middleware implementation?" },
    { role: 'user', content: 'Yes, start with the middleware. I want to protect /dashboard, /settings, and /billing routes.' },
    { role: 'assistant', content: "Here's the middleware implementation:\n\n```typescript\nimport { NextResponse } from 'next/server';\nimport type { NextRequest } from 'next/server';\n\nconst PROTECTED = ['/dashboard', '/settings', '/billing'];\nconst AUTH_ROUTES = ['/login', '/register'];\n\nexport function middleware(request: NextRequest) {\n  const { pathname } = request.nextUrl;\n  const token = request.cookies.get('auth-token')?.value;\n\n  // Redirect to login if not authenticated\n  if (PROTECTED.some(r => pathname.startsWith(r)) && !token) {\n    const url = new URL('/login', request.url);\n    url.searchParams.set('redirectTo', pathname);\n    return NextResponse.redirect(url);\n  }\n\n  // Redirect to dashboard if already authenticated\n  if (AUTH_ROUTES.includes(pathname) && token) {\n    return NextResponse.redirect(\n      new URL('/dashboard', request.url)\n    );\n  }\n\n  return NextResponse.next();\n}\n\nexport const config = {\n  matcher: [\n    '/dashboard/:path*',\n    '/settings/:path*',\n    '/billing/:path*',\n    '/login',\n    '/register',\n  ],\n};\n```\n\nThis gives you:\n- **Protected route enforcement** — unauthenticated users get redirected with a `redirectTo` param so they land back where they were after login\n- **Auth route guard** — logged-in users skip the login page\n- **Optimized matcher** — middleware only runs on relevant routes\n\nShall I continue with the login API route?" },
    { role: 'user', content: 'Perfect. Now create the login API route with JWT tokens stored in HTTP-only cookies.' },
    { role: 'assistant', content: "Here's the login API route:\n\n```typescript\n// app/api/auth/login/route.ts\nimport { NextResponse } from 'next/server';\nimport { sign } from 'jsonwebtoken';\nimport bcrypt from 'bcryptjs';\nimport { db } from '@/lib/db';\n\nexport async function POST(request: Request) {\n  const { email, password } = await request.json();\n\n  // Find user\n  const user = await db.user.findUnique({\n    where: { email },\n  });\n\n  if (!user || !await bcrypt.compare(password, user.passwordHash)) {\n    return NextResponse.json(\n      { error: 'Invalid credentials' },\n      { status: 401 }\n    );\n  }\n\n  // Create JWT\n  const token = sign(\n    { userId: user.id, email: user.email },\n    process.env.JWT_SECRET!,\n    { expiresIn: '7d' }\n  );\n\n  // Set HTTP-only cookie\n  const response = NextResponse.json({\n    user: { id: user.id, email: user.email, name: user.name },\n  });\n\n  response.cookies.set('auth-token', token, {\n    httpOnly: true,\n    secure: process.env.NODE_ENV === 'production',\n    sameSite: 'lax',\n    maxAge: 60 * 60 * 24 * 7, // 7 days\n    path: '/',\n  });\n\n  return response;\n}\n```\n\n**Security highlights:**\n- `httpOnly: true` — prevents XSS from accessing the token\n- `secure: true` in production — cookie only sent over HTTPS\n- `sameSite: 'lax'` — CSRF protection while allowing normal navigation\n- Passwords compared with bcrypt, never stored in plain text\n\nNext up: the registration route, or the client-side auth hook?" },
    { role: 'user', content: 'Show me the useAuth hook for client components.' },
    { role: 'assistant', content: "Here's a clean `useAuth` hook:\n\n```typescript\n// hooks/useAuth.ts\n'use client';\n\nimport { useState, useEffect, useCallback } from 'react';\n\ninterface User {\n  id: string;\n  email: string;\n  name: string;\n}\n\nexport function useAuth() {\n  const [user, setUser] = useState<User | null>(null);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    fetch('/api/auth/me')\n      .then(res => res.ok ? res.json() : null)\n      .then(data => setUser(data?.user ?? null))\n      .finally(() => setLoading(false));\n  }, []);\n\n  const logout = useCallback(async () => {\n    await fetch('/api/auth/logout', { method: 'POST' });\n    setUser(null);\n    window.location.href = '/login';\n  }, []);\n\n  return { user, loading, logout };\n}\n```\n\nThe `/api/auth/me` endpoint reads the JWT from the cookie, verifies it, and returns the user. No token handling needed on the client — the browser sends the cookie automatically.\n\nThis pattern keeps auth state synchronized between server and client components without prop drilling." },
  ],
  'conv-002': [
    { role: 'user', content: 'I have a CSV with monthly revenue data for 2025. Can you help me analyze trends and create a summary?' },
    { role: 'assistant', content: "I'd be happy to help analyze your revenue data. Since I can't read files directly, could you paste the data or describe the columns and a few rows?\n\nIn the meantime, here's what I can help with once I see the data:\n\n1. **Trend analysis** — month-over-month growth rates, moving averages\n2. **Seasonality detection** — identifying patterns across quarters\n3. **Forecasting** — simple projection based on historical trends\n4. **Summary statistics** — mean, median, variance, best/worst months\n5. **Visualization code** — Python (matplotlib/seaborn) or JavaScript (Chart.js/Recharts) charts\n\nGo ahead and share the data!" },
    { role: 'user', content: 'Here are the monthly figures:\nJan: $42,500\nFeb: $38,200\nMar: $45,800\nApr: $51,300\nMay: $49,700\nJun: $55,100\nJul: $52,800\nAug: $58,400\nSep: $62,100\nOct: $59,800\nNov: $67,200\nDec: $73,500' },
    { role: 'assistant', content: "Great data! Here's your revenue analysis:\n\n## 2025 Revenue Summary\n\n| Metric | Value |\n|--------|-------|\n| **Total Revenue** | $656,400 |\n| **Monthly Average** | $54,700 |\n| **Best Month** | December ($73,500) |\n| **Worst Month** | February ($38,200) |\n| **YoY Growth (Jan→Dec)** | +72.9% |\n\n## Trend Analysis\n\n📈 **Strong upward trend** — revenue grew from $42.5K to $73.5K over the year.\n\n**Month-over-month growth rates:**\n- Feb: -10.1% (seasonal dip)\n- Mar: +19.9% (recovery)\n- Apr: +12.0%\n- May: -3.1% (minor pullback)\n- Jun: +10.9%\n- Jul: -4.2%\n- Aug: +10.6%\n- Sep: +6.3%\n- Oct: -3.7%\n- Nov: +12.4%\n- Dec: +9.4%\n\n## Key Observations\n\n1. **Q1 was weakest** ($126.5K) — typical for many SaaS businesses\n2. **Q4 was strongest** ($200.5K) — 58% higher than Q1\n3. **Odd-month pattern** — slight dips in even months (Feb, May, Jul, Oct), suggesting a billing cycle effect\n4. **Accelerating growth** — H2 averaged $62.3K/month vs H1's $47.1K\n\n## Simple Forecast for Q1 2026\n\nBased on the 3-month moving average trend:\n- **Jan 2026**: ~$68,000–$72,000\n- **Feb 2026**: ~$65,000–$70,000 (seasonal dip expected)\n- **Mar 2026**: ~$72,000–$78,000\n\nWant me to generate chart code to visualize this?" },
    { role: 'user', content: 'Yes, give me a Recharts component for a Next.js dashboard.' },
    { role: 'assistant', content: "Here's a ready-to-use Recharts revenue chart component:\n\n```tsx\n'use client';\n\nimport {\n  LineChart, Line, XAxis, YAxis, CartesianGrid,\n  Tooltip, ResponsiveContainer, Area, AreaChart,\n} from 'recharts';\n\nconst data = [\n  { month: 'Jan', revenue: 42500 },\n  { month: 'Feb', revenue: 38200 },\n  { month: 'Mar', revenue: 45800 },\n  { month: 'Apr', revenue: 51300 },\n  { month: 'May', revenue: 49700 },\n  { month: 'Jun', revenue: 55100 },\n  { month: 'Jul', revenue: 52800 },\n  { month: 'Aug', revenue: 58400 },\n  { month: 'Sep', revenue: 62100 },\n  { month: 'Oct', revenue: 59800 },\n  { month: 'Nov', revenue: 67200 },\n  { month: 'Dec', revenue: 73500 },\n];\n\nconst formatCurrency = (val: number) =>\n  `$${(val / 1000).toFixed(1)}K`;\n\nexport function RevenueChart() {\n  return (\n    <div className=\"h-[400px] w-full\">\n      <ResponsiveContainer>\n        <AreaChart data={data}>\n          <defs>\n            <linearGradient id=\"rev\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">\n              <stop offset=\"5%\" stopColor=\"#3b82f6\" stopOpacity={0.3} />\n              <stop offset=\"95%\" stopColor=\"#3b82f6\" stopOpacity={0} />\n            </linearGradient>\n          </defs>\n          <CartesianGrid strokeDasharray=\"3 3\" className=\"opacity-30\" />\n          <XAxis dataKey=\"month\" />\n          <YAxis tickFormatter={formatCurrency} />\n          <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />\n          <Area\n            type=\"monotone\" dataKey=\"revenue\"\n            stroke=\"#3b82f6\" strokeWidth={2}\n            fill=\"url(#rev)\"\n          />\n        </AreaChart>\n      </ResponsiveContainer>\n    </div>\n  );\n}\n```\n\nDrop this into your dashboard and you'll have a clean area chart with gradient fill. The tooltip shows exact dollar amounts on hover." },
  ],
  'conv-003': [
    { role: 'user', content: 'Help me write a product launch email for our new AI-powered analytics dashboard. The product is called "InsightFlow" and it launches next Tuesday.' },
    { role: 'assistant', content: "Here's a launch email that balances excitement with substance:\n\n---\n\n**Subject:** InsightFlow is live — your data just got smarter\n\n**Preview text:** AI-powered analytics that surface the insights you'd miss.\n\n---\n\nHi {{first_name}},\n\nWe've been building something we're genuinely excited about, and today it's ready.\n\n**Introducing InsightFlow** — an analytics dashboard that uses AI to surface the insights hiding in your data.\n\n### What makes it different\n\nMost dashboards show you what happened. InsightFlow tells you **why it happened** and **what to do about it**.\n\n- **AI-generated insights** — anomalies, trends, and correlations detected automatically\n- **Natural language queries** — ask questions in plain English, get charts and answers\n- **Smart alerts** — get notified about meaningful changes, not noise\n- **One-click reports** — stakeholder-ready summaries generated in seconds\n\n### Early access pricing\n\nAs a subscriber, you get **30% off** for the first 6 months:\n\n→ [Start your free 14-day trial]({{cta_link}})\n\nNo credit card required. Import your first dataset in under 2 minutes.\n\n---\n\nWe built InsightFlow because we were tired of staring at dashboards and still not knowing what to do. If that sounds familiar, give it a try.\n\n— The InsightFlow Team\n\n*P.S. Reply to this email with your biggest analytics pain point. We read every response.*\n\n---\n\nWant me to adjust the tone, add a section, or create A/B subject line variants?" },
    { role: 'user', content: 'Can you give me 5 alternative subject lines I can A/B test?' },
    { role: 'assistant', content: "Here are 5 subject lines optimized for different psychological triggers:\n\n1. **Curiosity gap:**\n   > \"Your dashboard is hiding something from you\"\n\n2. **Specificity + benefit:**\n   > \"Cut your reporting time from 4 hours to 4 minutes\"\n\n3. **Social proof / exclusivity:**\n   > \"Join 200+ teams who ditched their old dashboards this week\"\n\n4. **Direct + punchy:**\n   > \"New: AI analytics that actually tell you what to do\"\n\n5. **Pain point:**\n   > \"Still manually building reports? There's a better way now\"\n\n### A/B testing tips\n\n- Test **two at a time** max — more variants need huge sample sizes\n- Subject lines 1 and 4 are your strongest pair (curiosity vs. direct)\n- Send to 20% of your list first, wait 2–4 hours, then send the winner to the remaining 80%\n- Track **open rate** for subject lines, **click rate** for body content\n\nWant me to draft the full email for any of these alternative angles?" },
    { role: 'user', content: 'I like #4. Also add an emoji version to test.' },
    { role: 'assistant', content: "Good pick — #4 is clear and compelling. Here are both versions:\n\n**Version A (no emoji):**\n> New: AI analytics that actually tell you what to do\n\n**Version B (with emoji):**\n> 🚀 AI analytics that actually tell you what to do\n\n### Quick note on emoji in subject lines\n\n**Pros:** Higher open rates in B2C and startup audiences (5–10% lift typically)\n\n**Cons:** Can feel unprofessional for enterprise/B2B — and some email clients render them inconsistently\n\n**My recommendation:** Test both. If your audience skews startup/SMB, the emoji version will likely win. If it's enterprise, the clean version usually performs better.\n\nAlso worth noting: the rocket emoji (🚀) is the most overused in SaaS emails. If you go emoji, consider:\n- ⚡ — implies speed/power\n- 📊 — directly relevant to analytics\n- ✨ — \"new and shiny\" without being cliché\n\nSo your final pair:\n- **A:** `New: AI analytics that actually tell you what to do`\n- **B:** `⚡ AI analytics that actually tell you what to do`\n\nShall I draft anything else for the launch?" },
  ],
  'conv-004': [
    { role: 'user', content: 'Can you explain async/await in Python? I come from JavaScript so I know the concept but Python\'s implementation confuses me.' },
    { role: 'assistant', content: "Great — since you already know JS async/await, I'll map Python's model to what you know and highlight the key differences.\n\n## The Core Difference\n\n**JavaScript:** The event loop is built into the runtime. Every JS environment (browser, Node) has one by default.\n\n**Python:** There's no built-in event loop. You need `asyncio` to create one explicitly.\n\n```python\nimport asyncio\n\nasync def main():\n    print(\"Hello\")\n    await asyncio.sleep(1)\n    print(\"World\")\n\nasyncio.run(main())  # Creates and runs the event loop\n```\n\n## Side-by-Side Comparison\n\n| Concept | JavaScript | Python |\n|---------|-----------|--------|\n| Define async fn | `async function foo()` | `async def foo()` |\n| Await a promise | `await fetch(url)` | `await aiohttp.get(url)` |\n| Run concurrently | `Promise.all([a, b])` | `asyncio.gather(a(), b())` |\n| Create a promise | `new Promise(...)` | `asyncio.Future()` (rare) |\n| Start event loop | Automatic | `asyncio.run(main())` |\n| Top-level await | Yes (ESM) | No (need `asyncio.run()`) |\n\n## The Biggest Gotcha\n\nIn Python, **calling an async function doesn't run it** — it returns a coroutine object:\n\n```python\nasync def fetch_data():\n    return 42\n\n# JS equivalent would execute immediately\nresult = fetch_data()   # ❌ Returns <coroutine>, doesn't run!\nresult = await fetch_data()  # ✅ Actually runs it\n```\n\nThis trips up every JS developer. In JavaScript, `fetch()` starts executing immediately and returns a Promise. In Python, `fetch_data()` creates a coroutine that sits there doing nothing until you `await` it.\n\nWant me to cover `asyncio.gather()` (Python's `Promise.all`) or the `aiohttp` library for async HTTP requests?" },
    { role: 'user', content: 'Yes, show me gather and how error handling differs.' },
    { role: 'assistant', content: "## `asyncio.gather()` — Python's `Promise.all()`\n\n```python\nimport asyncio\n\nasync def fetch_users():\n    await asyncio.sleep(1)\n    return ['Alice', 'Bob']\n\nasync def fetch_posts():\n    await asyncio.sleep(1.5)\n    return ['Post 1', 'Post 2']\n\nasync def main():\n    # Runs both concurrently — total time ≈ 1.5s, not 2.5s\n    users, posts = await asyncio.gather(\n        fetch_users(),\n        fetch_posts(),\n    )\n    print(users, posts)\n\nasyncio.run(main())\n```\n\n### Key difference from JS:\n- `Promise.all()` rejects immediately on first failure\n- `asyncio.gather()` has a `return_exceptions` flag:\n\n```python\n# Default: raises the first exception (like Promise.all)\nresults = await asyncio.gather(a(), b(), c())\n\n# With return_exceptions: returns exceptions as values (like Promise.allSettled)\nresults = await asyncio.gather(a(), b(), c(), return_exceptions=True)\n# results might be: ['data', ValueError('oops'), 'more data']\n```\n\n## Error Handling\n\n**JavaScript:**\n```javascript\ntry {\n  const data = await fetch(url);\n} catch (err) {\n  // Catches rejected promises\n}\n```\n\n**Python — almost identical:**\n```python\ntry:\n    data = await aiohttp_session.get(url)\nexcept aiohttp.ClientError as err:\n    # Catches async errors the same way\n```\n\n### The subtle difference: **cancellation**\n\nPython has `asyncio.CancelledError` — a special exception that's raised when a task is cancelled. JS doesn't have a native equivalent (you'd use AbortController).\n\n```python\ntask = asyncio.create_task(long_operation())\ntask.cancel()  # Raises CancelledError inside the coroutine\n\ntry:\n    await task\nexcept asyncio.CancelledError:\n    print('Task was cancelled')\n```\n\nThis is actually cleaner than JS's AbortController pattern." },
  ],
};

// ── Usage Stats ──────────────────────────────────────────────────────────────

export const DEMO_USAGE: UsageStats = {
  messages_used: 27,
  messages_limit: 5000,
  messages_remaining: 4973,
  tier: 'pro',
};

// ── Subscription ─────────────────────────────────────────────────────────────

export const DEMO_SUBSCRIPTION: SubscriptionStatus = {
  tier: 'pro',
  status: 'active',
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  cancel_at_period_end: false,
};

// ── Profile (for dashboard / settings pages) ─────────────────────────────────

export const DEMO_PROFILE = {
  id: 'demo-user-001',
  email: 'demo@nexabase.app',
  full_name: 'Demo User',
  tier: 'pro' as const,
  messages_used_this_month: 27,
  usage_period_start: '2026-03-01T00:00:00Z',
  stripe_customer_id: null,
  created_at: '2025-12-01T00:00:00Z',
  updated_at: '2026-03-18T09:42:00Z',
};
