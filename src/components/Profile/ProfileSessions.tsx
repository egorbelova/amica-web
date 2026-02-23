import styles from './Profile.module.scss';
// import { useTranslation } from '@/contexts/LanguageContext';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/utils/apiFetch';
import { useUser } from '@/contexts/UserContextCore';
import { Dropdown } from '../Dropdown/Dropdown';
import {
  websocketManager,
  type WebSocketMessage,
} from '@/utils/websocket-manager';
import type { Session } from '@/types';
import ProfileTabDescription from './ProfileTabDescription';

const SESSION_LIFETIME_OPTIONS = [
  // { value: 500, label: '5s' },
  // { value: 1000, label: '10s' },
  // { value: 3000, label: '30s' },
  // { value: 6000, label: '1m' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
  { value: 60, label: '2 months' },
  { value: 90, label: '3 months' },
  { value: 180, label: '6 months' },
];

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export default function ProfileSessions() {
  // const { t } = useTranslation();
  const { user, setUser } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionLifetime, setSessionLifetime] = useState<number>(
    user?.preferred_session_lifetime_days || 0,
  );
  const [savingLifetime, setSavingLifetime] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/active-sessions/');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Session[] = await res.json();
      setSessions(data.sort((a) => (a.is_current ? -1 : 1)));
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load active sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleWSMessage = useCallback(
    (data: WebSocketMessage) => {
      if (!data.type) return;
      switch (data.type) {
        case 'session_created':
          setSessions((prev) => [
            ...prev.filter((s) => s.jti !== data.session.jti),
            data.session,
          ]);
          break;
        case 'session_updated':
          setSessions((prev) =>
            prev.map((s) => (s.jti === data.session.jti ? data.session : s)),
          );
          break;
        case 'session_deleted':
          setSessions((prev) => prev.filter((s) => s.jti !== data.session.jti));
          break;
        case 'session_lifetime_updated':
          setSessionLifetime(data.days);
          if (user)
            setUser({ ...user, preferred_session_lifetime_days: data.days });
          break;
      }
    },
    [user, setUser],
  );

  useEffect(() => {
    websocketManager.on('message', handleWSMessage);
    if (!websocketManager.isConnected()) {
      websocketManager.connect();
    }
    return () => websocketManager.off('message', handleWSMessage);
  }, [handleWSMessage]);

  useEffect(() => {
    loadSessions();
    // const interval = setInterval(loadSessions, 30_000);
    // return () => clearInterval(interval);
  }, [loadSessions]);

  const updateSessionLifetime = async (value: number) => {
    setSavingLifetime(true);
    setSessionLifetime(value);
    if (user) setUser({ ...user, preferred_session_lifetime_days: value });

    websocketManager.sendMessage({
      type: 'set_session_lifetime',
      days: value,
    });

    setSavingLifetime(false);
  };

  const revokeSession = async (jti: string) => {
    try {
      const res = await apiFetch(`/api/active-sessions/${jti}/`, {
        method: 'DELETE',
      });
      if (res.ok) setSessions((prev) => prev.filter((s) => s.jti !== jti));
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
      <ProfileTabDescription
        title='Active sessions'
        description='Manage your active sessions and their lifetimes.'
        iconName='Sessions'
        backgroundColor='#ff6600'
      />
      {error && <div className={styles.error}>⚠️ {error}</div>}
      <div className={styles.sessionLifetime}>
        <label>Session lifetime: </label>
        {user && (
          <Dropdown
            items={SESSION_LIFETIME_OPTIONS.map((opt) => ({
              label: opt.label,
              value: opt.value,
            }))}
            value={sessionLifetime}
            onChange={updateSessionLifetime}
            placeholder='Select session lifetime'
            buttonStyles={styles.sessionLifetimeDropdown}
          />
        )}
        {savingLifetime && <span>Saving…</span>}
      </div>

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
                  {session.city ? `${session.city}, ` : ''}
                  {session.country ? session.country : ''}
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
              {session.is_current && sessions.length > 1 && (
                <button
                  className={styles.revokeAllBtn}
                  onClick={revokeOtherSessions}
                >
                  Terminate other sessions
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
