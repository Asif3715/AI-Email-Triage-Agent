import { describe, expect, it } from 'vitest';
import { computeStats } from './emailStats';

describe('computeStats', () => {
  const sample = [
    { status: 'received', action_taken: '' },
    { status: 'processing', action_taken: '' },
    { status: 'completed', action_taken: 'auto_reply' },
    { status: 'completed', action_taken: 'escalate' },
    { status: 'failed', action_taken: '' },
  ];

  it('counts totals and status buckets', () => {
    const stats = computeStats(sample);
    expect(stats.total).toBe(5);
    expect(stats.received).toBe(1);
    expect(stats.processing).toBe(1);
    expect(stats.completed).toBe(2);
    expect(stats.failed).toBe(1);
  });

  it('counts action types', () => {
    const stats = computeStats(sample);
    expect(stats.autoReply).toBe(1);
    expect(stats.escalate).toBe(1);
  });

  it('handles empty input', () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.autoReply).toBe(0);
  });

  it('handles nullish input', () => {
    const stats = computeStats(null);
    expect(stats.total).toBe(0);
  });
});
