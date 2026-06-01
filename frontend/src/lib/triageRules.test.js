import { describe, expect, it } from 'vitest';
import { validateDecision, CONFIDENCE_ESCALATE_THRESHOLD } from './triageRules';

describe('validateDecision', () => {
  it('escalates when confidence is below threshold', () => {
    const result = validateDecision({
      confidence: CONFIDENCE_ESCALATE_THRESHOLD - 1,
      action: 'auto_reply',
      reply_text: 'Hello',
    });
    expect(result.action).toBe('escalate');
    expect(result.escalation_reason).toContain('Confidence');
  });

  it('keeps auto_reply when confidence is high enough', () => {
    const result = validateDecision({
      confidence: 85,
      action: 'auto_reply',
      reply_text: 'Office hours are 2–4pm.',
    });
    expect(result.action).toBe('auto_reply');
  });

  it('normalizes invalid action to escalate', () => {
    const result = validateDecision({
      confidence: 90,
      action: 'delete_everything',
    });
    expect(result.action).toBe('escalate');
  });

  it('defaults missing fields', () => {
    const result = validateDecision({});
    expect(result.intent).toBe('other');
    expect(result.action).toBe('escalate');
    expect(result.confidence).toBe(0);
  });

  it('preserves clarify when confidence is sufficient', () => {
    const result = validateDecision({
      confidence: 75,
      action: 'clarify',
      clarifying_question: 'What is your student ID?',
    });
    expect(result.action).toBe('clarify');
    expect(result.clarifying_question).toBe('What is your student ID?');
  });
});
