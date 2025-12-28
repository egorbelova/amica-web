import styles from './Profile.module.scss';
import { useTranslation } from '@/contexts/LanguageContext';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/utils/apiFetch';

interface Session {
  jti: string;
  ip_address: string;
  device: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
  last_active: string;
  is_current: boolean;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export default function ProfileSessions() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/active-sessions/');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: Session[] = await res.json();

      const sorted = [...data].sort((a, b) => {
        if (a.is_current === b.is_current) return 0;
        return a.is_current ? -1 : 1;
      });

      setSessions(sorted);

      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load active sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 30_000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  const revokeSession = async (jti: string) => {
    try {
      const res = await apiFetch(`/api/active-sessions/${jti}/`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.jti !== jti));
      }
    } catch (err) {
      console.error('Failed to revoke session', err);
    }
  };

  const revokeOtherSessions = async () => {
    try {
      await apiFetch('/api/active-sessions/others/', { method: 'DELETE' });
      loadSessions();
    } catch (err) {
      console.error('Failed to revoke other sessions', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.section}>
        <h3>Active sessions</h3>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h3>Active sessions</h3>

      {error && <div className={styles.error}>⚠️ {error}</div>}

      {sessions.length === 0 ? (
        <p>No active sessions</p>
      ) : (
        <div className={styles.sessionsList}>
          {sessions.map((session) => (
            <div key={session.jti} className={styles.sessionItem}>
              <span>
                {session.is_current && (
                  <span className={styles.currentLabel}>This device</span>
                )}
              </span>

              <div
                className={`${styles.sessionInfo} ${
                  session.is_current ? styles.currentSession : ''
                }`}
              >
                <span className={styles.device}>{session.device}</span>

                <span className={styles.subInfo}>
                  IP address {session.ip_address}
                </span>

                <span className={styles.subInfo}>
                  Created {formatDate(session.created_at)}
                </span>

                <span className={styles.subInfo}>
                  Expires {formatDate(session.expires_at)}
                </span>

                <span className={styles.subInfo}>
                  Last active {formatDate(session.last_active)}
                </span>
              </div>

              {!session.is_current && (
                <button
                  className={styles.revokeBtn}
                  onClick={() => revokeSession(session.jti)}
                >
                  Terminate
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {sessions.length > 1 && (
        <button className={styles.revokeAllBtn} onClick={revokeOtherSessions}>
          Log out from all other devices
        </button>
      )}
    </div>
  );
}
