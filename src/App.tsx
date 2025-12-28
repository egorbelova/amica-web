import React, { useState, useEffect, useCallback } from 'react';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import RoomPage from './pages/RoomPage';
import getDeviceCornerRadius from './utils/getDeviceCornerRadius';
import { IconsSprite } from './components/Icons/AutoIcons';
import { useUser } from './contexts/UserContext';

type AppView = 'login' | 'signup';

const App: React.FC = () => {
  const { isAuthenticated, loading } = useUser();
  const [currentView, setCurrentView] = useState<AppView>('login');

  const showSignup = useCallback(() => setCurrentView('signup'), []);
  const showLogin = useCallback(() => setCurrentView('login'), []);

  useEffect(() => {
    const cornerRadiusPx = getDeviceCornerRadius();
    document.documentElement.style.setProperty(
      '--device-corner-radius',
      `${cornerRadiusPx}px`
    );
  }, []);

  if (loading) {
    return <div className='loader'>Loading…</div>;
  }

  return (
    <>
      <svg
        style={{
          width: '0',
          height: '0',
          position: 'absolute',
          visibility: 'hidden',
        }}
      >
        <defs>
          <linearGradient id='strokeGradient'>
            <stop offset='0%' stopColor='#ffffff' />
            <stop offset='100%' stopColor='#ccc' />
          </linearGradient>
        </defs>
      </svg>

      <IconsSprite />

      <div className='chat-container'>
        {isAuthenticated ? (
          <RoomPage />
        ) : currentView === 'login' ? (
          <LoginPage onShowSignup={showSignup} />
        ) : (
          // @ts-ignore
          <SignUpPage onShowLogin={showLogin} />
        )}
      </div>
    </>
  );
};

export default App;
