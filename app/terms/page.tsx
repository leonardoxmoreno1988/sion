// app/terms/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Patmos Research',
  description: 'Terms and conditions governing the use of Patmos Research platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
          <Link href="/chat" className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline block mb-3">
            ← Return to Chat
          </Link>
          <h1 className="text-3xl font-serif font-bold text-[#000f37] dark:text-slate-100 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">
            Last Updated: May 2026
          </p>
        </div>

        <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-sm sm:text-base">
          <p>
            Welcome to <strong>Patmos Research</strong> (accessible via patmosresearch.com). By accessing, browsing, or using our AI-powered Scripture analysis platform, you explicitly agree to comply with and be legally bound by these Terms of Service.
          </p>

          <h2 className="text-lg font-serif font-bold text-[#000f37] dark:text-slate-200 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            1. Nature of the Service
          </h2>
          <p>
            Patmos Research provides advanced artificial intelligence computational analysis toolsets tailored strictly for historical data correlation, textual synthesis, and inquiry over biblical manuscripts, primarily utilizing the Authorized King James Version (KJV). All services, streaming outputs, and query logs are provided on an "as is" and "as available" operational paradigm without warranties of any absolute kind.
          </p>

          <h2 className="text-lg font-serif font-bold text-[#000f37] dark:text-slate-200 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            2. Subscription Tiers, Billing, and Rates
          </h2>
          <p>
            We offer a basic tiered access structure encompassing a rate-limited free utilization capability alongside an unconstrained premium service level ("Watchman Tier" / "PRO") priced at <strong>$7.00 USD per month</strong>. All monetary processing operations, checkout pipelines, invoicing architectures, and tax management are securely routed and execution-delegated through our Merchant of Record, <strong>Paddle</strong>.
          </p>

          <h2 className="text-lg font-serif font-bold text-[#000f37] dark:text-slate-200 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            3. Account Integrity & Proper Utilization
          </h2>
          <p>
            You retain absolute exclusivity and total liability regarding the structural preservation, security, and usage credentials of your identity vault managed via our decentralized authentication mechanisms (Supabase Auth). Any attempt to systematically bypass inquiry velocity limits, script continuous automated parsing routines, scrape analytical data matrices, or inject malicious extraction prompts into the underlying large language pipelines will result in immediate and irrevocable permanent lifecycle termination of your profile.
          </p>

          <h2 className="text-lg font-serif font-bold text-[#000f37] dark:text-slate-200 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            4. Amendments to Terms
          </h2>
          <p>
            Patmos Research reserves the unilateral right to amend these operative guidelines at any juncture. Continued interaction with the network following structural modifications establishes full automatic baseline validation of the updated terms.
          </p>
        </div>
      </div>
    </div>
  );
}