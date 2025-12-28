// components/Message/MessageTime.tsx
import React from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/settings/useSettings';

interface MessageTimeProps {
  date: string;
  className?: string;
}

const MessageTime: React.FC<MessageTimeProps> = ({ date, className = '' }) => {
  const { t } = useTranslation();
  const { settings } = useSettings();

  const formatTime = (dateString: string): string => {
    try {
      const dateObj = new Date(dateString);

      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');

      if (settings.timeFormat === '24h') {
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
      }

      const ampm = hours >= 12 ? t('language.time.pm') : t('language.time.am');
      const twelveHour = hours % 12 || 12;
      return `${twelveHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return <span className={`time-left ${className}`}>{formatTime(date)}</span>;
};

export default MessageTime;
