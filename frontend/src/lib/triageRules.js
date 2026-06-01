const CONFIDENCE_ESCALATE_THRESHOLD = 70;
const VALID_ACTIONS = ['auto_reply', 'clarify', 'escalate'];

/**
 * Mirrors intended triage policy (documented + tested on frontend).
 * Apps Script still relies on Groq output at runtime; use this for tests and UI hints.
 */
export function validateDecision(decision) {
  const normalized = {
    intent: decision?.intent || 'other',
    entities: decision?.entities || {},
    confidence: Number(decision?.confidence ?? 0),
    action: decision?.action || 'escalate',
    reply_text: decision?.reply_text || '',
    clarifying_question: decision?.clarifying_question || '',
    escalation_reason: decision?.escalation_reason || '',
  };

  if (!VALID_ACTIONS.includes(normalized.action)) {
    normalized.action = 'escalate';
    normalized.escalation_reason =
      normalized.escalation_reason || 'Invalid action from model';
  }

  if (normalized.confidence < CONFIDENCE_ESCALATE_THRESHOLD) {
    normalized.action = 'escalate';
    if (!normalized.escalation_reason) {
      normalized.escalation_reason = 'Confidence below threshold';
    }
  }

  return normalized;
}

export { CONFIDENCE_ESCALATE_THRESHOLD, VALID_ACTIONS };
