# Demo Script

Use these sample emails to demonstrate the three triage actions. Send them from a second account (or alias) to the Gmail inbox monitored by the agent. Wait up to one minute for the time trigger, or run `pollInbox()` manually in Apps Script.

## 1. Auto-reply (high-confidence general inquiry)

**Subject:** Office hours for CS 101

**Body:**

```
Hi,

What are the office hours for CS 101 this week?

Thanks,
Alex
```

**Expected behavior:** `action` = `auto_reply`, intent likely `general_inquiry` or `course_registration`, confidence typically high. Sheet row shows `completed` and a professional reply in `reply_sent`.

---

## 2. Clarify (missing information)

**Subject:** Fee question

**Body:**

```
Hello,

I think I was charged incorrectly on my account. Can you help?

Thanks
```

**Expected behavior:** `action` = `clarify`. The agent sends only a clarifying question (e.g. student ID, term, amount). Check `reply_sent` in the dashboard modal.

---

## 3. Escalate (urgent or low confidence)

**Subject:** URGENT - transcript needed today

**Body:**

```
I need my official transcript sent to an employer by end of day today.
My student ID is 12345. This is extremely urgent.
```

**Expected behavior:** `action` = `escalate`. Student receives an acknowledgment reply; `HUMAN_SUPPORT_EMAIL` receives an escalation email with full thread content. Dashboard shows `escalate` in stats.

---

## Verifying the demo

1. Open the React dashboard (`npm run dev` in `frontend/`).
2. Confirm new rows appear within ~5 seconds of processing.
3. Click a row to open the detail modal (body preview, entities, raw Groq JSON).
4. Open the Google Sheet `emails` tab to show the audit trail.

## If nothing appears

See [Troubleshooting](README.md#troubleshooting) in the README.
