// app/privacy/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Patmos Research',
  description: 'Privacy rules and data handling procedures for Patmos Research.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
          <Link href="/chat" className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline block mb-3">
            ← Return to Chat
          </Link>
          <h1 className="text-3xl font-serif font-bold text-[#000f37] dark:text-slate-100 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">
            Last Updated: May 2026
          </p>
        </div>

        <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-sm sm:text-base">
          <p>
            At <strong>Patmos Research</strong>, we hold an unyielding commitment to the computational protection and ethical containment of your personal identity parameters. This documentation clearly delineates how data inputs are isolated, persisted, and guarded.
          </p>

          <h2 className="text-lg font-serif font-bold text-[#000f37] dark:text-slate-200 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            1. Information Accumulation Framework
          </h2>
          <p>
            During your operational enrollment protocol, we gather your explicit <strong>email address</strong> to anchor your authentication session profile managed entirely through military-grade isolated token instances via Supabase SSR Client architecture. We strictly **do not capture, process, or log credit card numerical arrays, CVV signatures, or bank routing keys** inside our native infrastructure databases. All transaction vectors are direct-tunneled and processed via Paddle using secure encrypted tokens.
          </p>

          <h2 className="text-lg font-serif font-bold text-[#000f37] dark:text-slate-200 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            2. Core Data Utilization & Persistence
          </h2>
          <p>
            Your account profile variables are strictly mapped to provision your specific entitlement tier permissions and securely render your local <strong>historical inquiry session log registries</strong> inside the sidebar container. Chat records are encapsulated inside encrypted tables and are never leased, distributed, bartered, or propagated to any external corporate analytical aggregate or artificial intelligence model training queues.
          </p>

          <h2 className="text-lg font-serif font-bold text-[#000f37] dark:text-slate-200 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            3. Cookies & Analytical Identifiers
          </h2>
          <p>
            We deploy secure, stateful server-side cookies strictly optimized to preserve authenticated runtime cycles, handle dynamic language context shifts (English/Spanish), and store secure cryptographic handshake nonces required by the underlying data pipeline.
          </p>
        </div>
      </div>
    </div>
  );
}