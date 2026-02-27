import styles from './ChatHeader.module.scss';
import { useAudio } from '@/contexts/audioContext';
import { Icon } from '../Icons/AutoIcons';
import AudioEqualizer from './AudioEqualizer';
import Button from '../ui/button/Button';

export const MediaHeader: React.FC = () => {
  const {
    isPlaying,
    currentAudioId,
    playlist,
    setCurrentAudioId,
    togglePlay,
    coverUrl,
  } = useAudio();

  const currentTrack = currentAudioId
    ? playlist?.find((f) => f.id === currentAudioId)
    : undefined;

  if (!currentAudioId) return null;
  return (
    <div className={styles['media-header']}>
      <div className={styles['media-header__leftside']}>
        {/* <button type='button' onClick={() => setCurrentAudioId(null)}> */}
        <button
          type='button'
          onClick={() => togglePlay(currentAudioId)}
          className={styles['media-header__toggle']}
        >
          {coverUrl && (
            <img src={coverUrl} className={styles['media-header__cover']} />
          )}

          {isPlaying ? <Icon name='Pause' /> : <Icon name='Play' />}
        </button>
        {currentTrack && (
          <div className={styles['media-header__current']}>
            {currentTrack.original_name}
          </div>
        )}
      </div>
      <div className={styles['media-header__rightside']}>
        <AudioEqualizer />
        <Button
          key={'media-header-close-button'}
          onClick={() => setCurrentAudioId(null)}
          className={styles['media-header__close']}
        >
          <Icon name='Cross' className={styles.close} />
        </Button>
      </div>
    </div>
  );
};
