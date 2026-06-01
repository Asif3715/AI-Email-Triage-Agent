import { useState } from 'react';

export default function DecisionModal({ email, onClose }) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Email Details</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">Close</button>
        </div>

        <div className="space-y-4 px-6 py-5 text-sm">
          <Field label="From" value={email.from_email} />
          <Field label="Subject" value={email.subject} />
          <Field label="Status" value={email.status} />
          <Field label="Intent" value={email.intent} />
          <Field label="Action" value={email.action_taken} />
          <Field label="Confidence" value={`${email.confidence || 0}%`} />

          <div>
            <div className="font-medium text-slate-500">Body Preview</div>
            <div className="mt-1 rounded-lg border bg-slate-50 p-3 whitespace-pre-wrap">
              {email.body_preview || '-'}
            </div>
          </div>

          <div>
            <div className="font-medium text-slate-500">Reply Sent</div>
            <div className="mt-1 rounded-lg border bg-slate-50 p-3 whitespace-pre-wrap">{email.reply_sent || '-'}</div>
          </div>

          <div>
            <div className="font-medium text-slate-500">Entities</div>
            <pre className="mt-1 overflow-x-auto rounded-lg border bg-slate-50 p-3 text-xs">{JSON.stringify(email.entities || {}, null, 2)}</pre>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowRaw((open) => !open)}
              className="font-medium text-slate-600 hover:text-slate-900"
            >
              {showRaw ? 'Hide' : 'Show'} raw Groq response
            </button>
            {showRaw ? (
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg border bg-slate-50 p-3 text-xs">
                {JSON.stringify(email.groq_response_raw || {}, null, 2)}
              </pre>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-slate-900">{value || '-'}</div>
    </div>
  );
}
