const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-70b-8192';
const SHEET_NAME = 'emails';
const CONFIG_SHEET_NAME = 'config';
const PROCESSED_LABEL = 'ai-triaged';

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    groqApiKey: props.getProperty('GROQ_API_KEY'),
    spreadsheetId: props.getProperty('SPREADSHEET_ID'),
    humanSupportEmail: props.getProperty('HUMAN_SUPPORT_EMAIL') || '',
    pollLookbackMinutes: Number(props.getProperty('POLL_LOOKBACK_MINUTES') || '10'),
  };
}

function requireConfig() {
  const config = getConfig();
  const missing = [];
  if (!config.groqApiKey) missing.push('GROQ_API_KEY');
  if (!config.spreadsheetId) missing.push('SPREADSHEET_ID');
  if (missing.length) {
    throw new Error('Missing script properties: ' + missing.join(', '));
  }
  return config;
}

function getSpreadsheet() {
  const { spreadsheetId } = requireConfig();
  return SpreadsheetApp.openById(spreadsheetId);
}

function getEmailsSheet() {
  return getSpreadsheet().getSheetByName(SHEET_NAME);
}

function getOrCreateLabel() {
  const label = GmailApp.getUserLabelByName(PROCESSED_LABEL);
  return label || GmailApp.createLabel(PROCESSED_LABEL);
}

function setupSheet() {
  const ss = SpreadsheetApp.create('AI Email Triage Agent');
  const sheet = ss.getActiveSheet();
  sheet.setName(SHEET_NAME);
  sheet.appendRow([
    'timestamp',
    'from_email',
    'subject',
    'body_preview',
    'intent',
    'entities',
    'confidence',
    'action_taken',
    'reply_sent',
    'groq_response_raw',
    'status',
    'email_id',
    'thread_id',
  ]);

  let configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
  if (!configSheet) {
    configSheet = ss.insertSheet(CONFIG_SHEET_NAME);
  }
  configSheet.clear();
  configSheet.appendRow(['key', 'value']);
  configSheet.appendRow(['last_processed_timestamp', '']);

  Logger.log('Spreadsheet ID: ' + ss.getId());
  return ss.getId();
}

function setupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('pollInbox')
    .timeBased()
    .everyMinutes(1)
    .create();
}

function pollInbox() {
  const config = requireConfig();
  const label = getOrCreateLabel();
  const lookback = config.pollLookbackMinutes;
  const processedIds = getProcessedEmailIds();
  const query = `in:inbox is:unread newer_than:${lookback}m -label:${PROCESSED_LABEL}`;
  const threads = GmailApp.search(query, 0, 20);

  threads.forEach((thread) => {
    if (thread.getLabels().some((item) => item.getName() === PROCESSED_LABEL)) return;

    const messages = thread.getMessages();
    messages.forEach((message) => {
      if (message.isInChats()) return;
      if (!message.isUnread()) return;
      const messageId = String(message.getId());
      if (processedIds[messageId]) return;
      processMessage(message, label, processedIds);
    });
  });
}

function getProcessedEmailIds() {
  const sheet = getEmailsSheet();
  const lastRow = sheet.getLastRow();
  const ids = {};
  if (lastRow < 2) return ids;

  const values = sheet.getRange(2, 12, lastRow, 12).getValues();
  values.forEach((row) => {
    if (row[0]) ids[String(row[0])] = true;
  });
  return ids;
}

function processMessage(message, processedLabel, processedIds) {
  const messageId = String(message.getId());
  if (processedIds && processedIds[messageId]) return;
  if (processedIds) processedIds[messageId] = true;

  const rowIndex = addToSheet(message, 'received');
  try {
    updateSheetStatus(rowIndex, 'processing');
    const emailData = buildEmailData(message);

    const decision = callGroqAPI(emailData);
    updateSheetRow(rowIndex, decision, emailData);
    sendReply(message, decision);
    updateSheetStatus(rowIndex, 'completed');
    const closeThread = decision.action !== 'clarify';
    markThreadProcessed(message, processedLabel, closeThread);
  } catch (error) {
    updateSheetStatus(rowIndex, 'failed');
    safeSendFailure(message, error);
    markThreadProcessed(message, processedLabel, true);
    Logger.log(error.toString());
  }
}

function buildEmailData(message) {
  const thread = message.getThread();
  const threadMessages = thread.getMessages();
  const currentId = String(message.getId());
  const transcript = threadMessages
    .map((m, idx) => {
      const marker = String(m.getId()) === currentId ? ' [CURRENT — reply to this]' : '';
      return (
        '--- Message ' +
        (idx + 1) +
        marker +
        ' ---\nFrom: ' +
        m.getFrom() +
        '\n' +
        (m.getPlainBody() || '')
      );
    })
    .join('\n\n');

  return {
    from: message.getFrom(),
    subject: message.getSubject() || '',
    body: message.getPlainBody() || '',
    threadTranscript: transcript,
    timestamp: new Date().toISOString(),
    emailId: message.getId(),
    threadId: thread.getId(),
  };
}

function markThreadProcessed(message, processedLabel, closeThread) {
  try {
    message.markRead();
    if (closeThread) {
      processedLabel.addToThread(message.getThread());
    }
  } catch (e) {
    Logger.log('Failed to mark thread processed: ' + e.toString());
  }
}

function callGroqAPI(emailData) {
  const { groqApiKey } = requireConfig();
  const systemPrompt = `You are an email triage agent for a university student services center.

Return ONLY valid JSON in this exact format:
{
  "intent": "password_reset | fee_dispute | transcript_request | course_registration | general_inquiry | other",
  "entities": {
    "student_id": "string or null",
    "deadline_date": "YYYY-MM-DD or null",
    "amount": "number or null",
    "course_code": "string or null",
    "department": "string or null"
  },
  "confidence": 0-100,
  "action": "auto_reply | clarify | escalate",
  "reply_text": "string",
  "clarifying_question": "string",
  "escalation_reason": "string"
}

Rules:
- If confidence < 70, set action = "escalate"
- If action = "clarify", reply_text must contain only the question
- If the thread shows you already asked for information and the user replied with it, do not ask again — use auto_reply or escalate
- If urgent keywords appear, prefer escalate
- Keep reply_text concise and professional`;

  const userPrompt = [
    'Subject: ' + emailData.subject,
    'From: ' + emailData.from,
    'Thread history (oldest to newest):',
    emailData.threadTranscript || emailData.body,
    '',
    'Process only the message marked [CURRENT — reply to this]. Use earlier messages for context.',
  ].join('\n');

  const payload = {
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  };

  const response = UrlFetchApp.fetch(GROQ_API_URL, {
    method: 'post',
    headers: {
      Authorization: 'Bearer ' + groqApiKey,
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const statusCode = response.getResponseCode();
  const rawText = response.getContentText();
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Groq API error ' + statusCode + ': ' + rawText.slice(0, 500));
  }

  const parsed = JSON.parse(rawText);
  const content = parsed.choices && parsed.choices[0] && parsed.choices[0].message && parsed.choices[0].message.content;
  if (!content) {
    throw new Error('Groq response missing message content');
  }

  const decision = JSON.parse(content);
  return {
    intent: decision.intent || 'other',
    entities: decision.entities || {},
    confidence: Number(decision.confidence || 0),
    action: decision.action || 'escalate',
    reply_text: decision.reply_text || '',
    clarifying_question: decision.clarifying_question || '',
    escalation_reason: decision.escalation_reason || '',
    groq_response_raw: decision,
  };
}

function addToSheet(message, status) {
  const sheet = getEmailsSheet();
  const row = [
    new Date().toISOString(),
    message.getFrom(),
    message.getSubject() || '',
    (message.getPlainBody() || '').slice(0, 200),
    '',
    '',
    '',
    '',
    '',
    '',
    status,
    message.getId(),
    message.getThread().getId(),
  ];
  sheet.appendRow(row);
  return sheet.getLastRow();
}

function updateSheetRow(rowIndex, decision, emailData) {
  const sheet = getEmailsSheet();
  sheet.getRange(rowIndex, 5).setValue(decision.intent);
  sheet.getRange(rowIndex, 6).setValue(JSON.stringify(decision.entities));
  sheet.getRange(rowIndex, 7).setValue(decision.confidence);
  sheet.getRange(rowIndex, 8).setValue(decision.action);
  sheet.getRange(rowIndex, 9).setValue(decision.reply_text);
  sheet.getRange(rowIndex, 10).setValue(JSON.stringify(decision.groq_response_raw));
  sheet.getRange(rowIndex, 11).setValue('completed');
  sheet.getRange(rowIndex, 12).setValue(emailData.emailId);
  sheet.getRange(rowIndex, 13).setValue(emailData.threadId);
}

function updateSheetStatus(rowIndex, status) {
  getEmailsSheet().getRange(rowIndex, 11).setValue(status);
}

function sendReply(message, decision) {
  if (decision.action === 'clarify') {
    message.getThread().reply(decision.clarifying_question || decision.reply_text);
    return;
  }

  if (decision.action === 'escalate') {
    const replyText = decision.reply_text || 'Thanks for your email. We have escalated this to human support.';
    message.getThread().reply(replyText);
    notifyHuman(message, decision);
    return;
  }

  message.getThread().reply(decision.reply_text || 'Thanks for your email. We will get back to you shortly.');
}

function notifyHuman(message, decision) {
  const { humanSupportEmail } = getConfig();
  if (!humanSupportEmail) return;

  const body = [
    'ESCALATED EMAIL',
    'Reason: ' + (decision.escalation_reason || 'Confidence too low'),
    'From: ' + message.getFrom(),
    'Subject: ' + message.getSubject(),
    '',
    message.getPlainBody(),
  ].join('\n');

  GmailApp.sendEmail(humanSupportEmail, 'Escalated email: ' + message.getSubject(), body);
}

function safeSendFailure(message, error) {
  try {
    message.getThread().reply('We could not fully process your email right now. A human will review it shortly.');
  } catch (e) {
    Logger.log('Failed to send failure notice: ' + e.toString());
  }
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'list';
  if (action === 'health') {
    return jsonResponse({ ok: true, timestamp: new Date().toISOString() });
  }

  const sheet = getEmailsSheet();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1).map((row, index) => ({
    id: index + 1,
    timestamp: row[0],
    from_email: row[1],
    subject: row[2],
    body_preview: row[3],
    intent: row[4],
    entities: safeJsonParse(row[5]),
    confidence: Number(row[6] || 0),
    action_taken: row[7],
    reply_sent: row[8],
    groq_response_raw: safeJsonParse(row[9]),
    status: row[10],
    email_id: row[11],
    thread_id: row[12],
  }));

  return jsonResponse({
    updatedAt: new Date().toISOString(),
    rows,
  });
}

function safeJsonParse(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
}
