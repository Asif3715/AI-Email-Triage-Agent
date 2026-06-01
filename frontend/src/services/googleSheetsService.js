import axios from 'axios';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const REQUEST_TIMEOUT_MS = 15000;

export function isAppsScriptConfigured() {
  return Boolean(APPS_SCRIPT_URL);
}

export async function fetchEmails() {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Missing VITE_APPS_SCRIPT_URL in frontend/.env');
  }

  try {
    const response = await axios.get(APPS_SCRIPT_URL, {
      params: { action: 'list' },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.data.rows || [];
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED') {
        throw new Error('Request timed out — check your Apps Script deployment URL');
      }
      if (err.response?.status) {
        throw new Error(`Dashboard API returned ${err.response.status}`);
      }
      if (err.message === 'Network Error') {
        throw new Error('Network error — is the Apps Script web app deployed and reachable?');
      }
    }
    throw err;
  }
}
