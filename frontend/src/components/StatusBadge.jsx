export default function StatusBadge({ status }) {
  const map = {
    received: 'bg-slate-100 text-slate-700',
    processing: 'bg-amber-100 text-amber-800',
    completed: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-rose-100 text-rose-800',
  };

  return <span className={`rounded-full px-2 py-1 text-xs ${map[status] || map.received}`}>{status || 'received'}</span>;
}
