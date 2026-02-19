import styles from './ChatHeader.module.scss';
import { useAudio } from '@/contexts/audioContext';
import { Icon } from '../Icons/AutoIcons';

export const MediaHeader: React.FC = () => {
  const {
    isPlaying,
    currentAudioId,
    playlist,
    setCurrentAudioId,
    togglePlay,
    coverUrl,
  } = useAudio();
  //   console.log(coverUrl);

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
      <button
        type='button'
        onClick={() => setCurrentAudioId(null)}
        className={styles['media-header__rightside']}
      >
        <Icon name='Cross' className={styles.close} />
      </button>
    </div>
  );
};
