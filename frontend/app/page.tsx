import Link from "next/link";
import { ArrowRight, Bot, Shield, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Bot className="h-6 w-6 text-blue-400" />
          NexaBase
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-slate-300 hover:text-white transition-colors text-sm"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-950 border border-blue-800 text-blue-300 px-3 py-1 rounded-full text-xs font-medium mb-8">
          <Zap className="h-3 w-3" />
          Powered by GPT-4o mini + LangChain
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-300">
          Your AI assistant,
          <br />
          production-ready.
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          NexaBase gives you a full-stack AI SaaS starter with auth, billing,
          usage tracking, and an intelligent chat UI — in minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
          >
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 px-8 py-3 rounded-xl font-semibold transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Bot className="h-6 w-6 text-blue-400" />,
              title: "AI Chat",
              desc: "GPT-4o mini via LangChain with conversation history, streaming, and context-aware responses.",
            },
            {
              icon: <Shield className="h-6 w-6 text-blue-400" />,
              title: "Secure Auth",
              desc: "Supabase Auth with JWT tokens, protected routes, and row-level security built in.",
            },
            {
              icon: <Zap className="h-6 w-6 text-blue-400" />,
              title: "Stripe Billing",
              desc: "Free & Pro tiers with usage limits, webhooks, customer portal, and automatic renewal.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
            >
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Simple pricing</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <h3 className="font-bold text-xl mb-1">Free</h3>
            <p className="text-slate-400 text-sm mb-6">Great for trying NexaBase</p>
            <div className="text-4xl font-extrabold mb-6">
              $0<span className="text-lg font-normal text-slate-400">/mo</span>
            </div>
            <ul className="space-y-3 text-sm text-slate-300 mb-8">
              <li>✓ 50 AI messages / month</li>
              <li>✓ Conversation history</li>
              <li>✓ Standard support</li>
            </ul>
            <Link
              href="/register"
              className="block text-center border border-slate-600 hover:border-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Get started
            </Link>
          </div>
          {/* Pro */}
          <div className="bg-blue-600 border border-blue-500 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-3 right-4 bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
              Popular
            </div>
            <h3 className="font-bold text-xl mb-1">Pro</h3>
            <p className="text-blue-200 text-sm mb-6">For power users & teams</p>
            <div className="text-4xl font-extrabold mb-6">
              $19<span className="text-lg font-normal text-blue-200">/mo</span>
            </div>
            <ul className="space-y-3 text-sm text-blue-100 mb-8">
              <li>✓ 5,000 AI messages / month</li>
              <li>✓ Conversation history</li>
              <li>✓ Priority support</li>
              <li>✓ Early access to new features</li>
            </ul>
            <Link
              href="/register"
              className="block text-center bg-white text-blue-700 hover:bg-blue-50 px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </section>

      <footer className="text-center py-8 text-slate-500 text-sm">
        © {new Date().getFullYear()} NexaBase. Built with Next.js 14 + FastAPI + Supabase + Stripe.
      </footer>
    </div>
  );
}
