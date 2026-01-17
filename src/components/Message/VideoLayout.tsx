import { usePrivateMedia } from '@/hooks/usePrivateMedia';

export default function VideoLayout({ full }) {
  const { objectUrl } = usePrivateMedia(full);

  if (!objectUrl) return null;

  return (
    <video
      src={objectUrl}
      muted
      autoPlay
      loop
      playsInline
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        objectFit: 'cover',
      }}
    />
  );
}
