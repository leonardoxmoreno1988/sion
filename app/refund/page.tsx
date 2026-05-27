// app/refund/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Refund & Cancellation Policy | Patmos Research',
  description: 'Refund terms and continuous cancellation guidelines for Patmos Research subscriptions.',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
          <Link href="/chat" className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline block mb-3">
            ← Return to Chat
          </Link>
          <h1 className="text-3xl font-serif font-bold text-[#000f37] dark:text-slate-100 tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">
            Last Updated: May 2026
          </p>
        </div>

        <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-sm sm:text-base">
          <h2 className="text-lg font-serif font-bold text-[#000f37] dark:text-slate-200">
            1. Absolute Freedom of Cancellation
          </h2>
          <p>
            You retain absolute structural autonomy over your premium account level tier. You may execute a formal subscription cancellation at any precise moment by clicking the <strong>"Bill / Factura"</strong> interface action portal directly at the application header bar. 
          </p>
          <p>
            Following a cancellation event processed through the Paddle secure portal pipeline, your premium capabilities will not be hard-severed immediately; you will preserve unrestricted continuous access to the entire unlimited AI query engine layout until the final concluding second of your active, prepaid monthly operational cycle.
          </p>

          <h2 className="text-lg font-serif font-bold text-[#000f37] dark:text-slate-200 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            2. Non-Refundable Nature of Active Cycles
          </h2>
          <p>
            Due to the immediate architectural allocation overhead and real-time GPU/API transactional costs required to execute complex model streaming loops, <strong>Patmos Research does not issue full or partial retroactive refunds</strong> for active subscription periods already billed by our merchant processor.
          </p>

          <h2 className="text-lg font-serif font-bold text-[#000f37] dark:text-slate-200 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            3. Exceptional Billing Incidents
          </h2>
          <p>
            If a double-charge or unintended duplicate transactional mutation occurs over your banking ledger due to a synchronization glitch on the network checkout, please immediately flag the issue via billing support. Verified pipeline anomalies will be fully credited back to your original transaction vehicle in an urgent manner.
          </p>
        </div>
      </div>
    </div>
  );
}