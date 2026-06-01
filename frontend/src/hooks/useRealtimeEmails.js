import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchEmails, isAppsScriptConfigured } from '../services/googleSheetsService';

export function useRealtimeEmails(pollInterval = 5000) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState('');
  const [configError, setConfigError] = useState('');
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);

  const loadEmails = useCallback(async () => {
    if (!isAppsScriptConfigured()) {
      setConfigError('Set VITE_APPS_SCRIPT_URL in frontend/.env and restart the dev server.');
      setEmails([]);
      setLoading(false);
      return;
    }

    setConfigError('');
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    try {
      const data = await fetchEmails();
      setEmails(data);
      setLastUpdate(new Date());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emails');
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmails();
    timerRef.current = window.setInterval(loadEmails, pollInterval);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [loadEmails, pollInterval]);

  return {
    emails,
    loading,
    lastUpdate,
    error,
    configError,
    refresh: loadEmails,
    isConfigured: isAppsScriptConfigured(),
  };
}
