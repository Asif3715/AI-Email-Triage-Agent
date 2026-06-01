export function computeStats(emails) {
  const list = emails || [];
  return {
    total: list.length,
    received: list.filter((email) => email.status === 'received').length,
    processing: list.filter((email) => email.status === 'processing').length,
    completed: list.filter((email) => email.status === 'completed').length,
    failed: list.filter((email) => email.status === 'failed').length,
    autoReply: list.filter((email) => email.action_taken === 'auto_reply').length,
    escalate: list.filter((email) => email.action_taken === 'escalate').length,
  };
}
