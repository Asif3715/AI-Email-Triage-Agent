import { useMemo, useState } from 'react';
import { useRealtimeEmails } from './hooks/useRealtimeEmails';
import { computeStats } from './lib/emailStats';
import StatusBadge from './components/StatusBadge';
import DecisionModal from './components/DecisionModal';

export default function App() {
  const { emails, loading, lastUpdate, refresh, error, configError } = useRealtimeEmails(5000);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filter, setFilter] = useState('all');

  const stats = useMemo(() => computeStats(emails), [emails]);
  const filteredEmails = filter === 'all' ? emails : emails.filter((email) => email.status === filter);

  return (
    <div className="min-h-screen">
      {configError ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {configError}
        </div>
      ) : null}

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold">AI Email Triage Agent</h1>
            <p className="text-sm text-slate-500">Live dashboard polling every 5 seconds</p>
          </div>
          <button onClick={refresh} className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Received" value={stats.received} tone="slate" />
          <StatCard label="Processing" value={stats.processing} tone="amber" />
          <StatCard label="Completed" value={stats.completed} tone="emerald" />
          <StatCard label="Failed" value={stats.failed} tone="rose" />
          <StatCard label="Auto Reply" value={stats.autoReply} tone="blue" />
          <StatCard label="Escalated" value={stats.escalate} tone="violet" />
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b pb-3">
          {['all', 'received', 'processing', 'completed', 'failed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-full px-4 py-2 text-sm capitalize ${filter === tab ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3 text-sm text-slate-500">
            <span>{loading ? 'Loading...' : `Updated ${lastUpdate ? lastUpdate.toLocaleTimeString() : 'now'}`}</span>
            {error ? <span className="text-rose-600">{error}</span> : null}
          </div>

          {filteredEmails.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {configError ? 'Configure the Apps Script URL to load emails.' : 'No emails found'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredEmails.map((email) => (
                <button
                  key={email.email_id || `${email.id}`}
                  onClick={() => setSelectedEmail(email)}
                  className="w-full px-4 py-4 text-left hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">{email.from_email}</p>
                        <StatusBadge status={email.status} />
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{email.intent || 'unknown'}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-800">{email.subject}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{email.body_preview}</p>
                    </div>
                    <div className="text-sm text-slate-500 lg:text-right">
                      <div>{email.timestamp ? new Date(email.timestamp).toLocaleString() : '-'}</div>
                      <div className="mt-1">{email.action_taken || '-'}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedEmail ? <DecisionModal email={selectedEmail} onClose={() => setSelectedEmail(null)} /> : null}
    </div>
  );
}

function StatCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white',
    amber: 'border-amber-200 bg-amber-50',
    emerald: 'border-emerald-200 bg-emerald-50',
    rose: 'border-rose-200 bg-rose-50',
    blue: 'border-blue-200 bg-blue-50',
    violet: 'border-violet-200 bg-violet-50',
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${tones[tone]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
}
