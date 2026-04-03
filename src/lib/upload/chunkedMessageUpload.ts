import { apiFetch } from '@/utils/apiFetch';

/** Use chunked + parallel upload when a video is at least this size. */
export const VIDEO_CHUNK_UPLOAD_MIN_BYTES = 3 * 1024 * 1024;

export const CHUNK_UPLOAD_PARALLELISM = 6;

type MediaKind = 'image' | 'video' | 'audio' | 'file';

function getDeclaredMediaKind(file: File): MediaKind {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';

  const name = file.name.toLowerCase();
  if (
    ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.mpeg', '.flv', '.m4v'].some(
      (ext) => name.endsWith(ext),
    )
  ) {
    return 'video';
  }
  if (
    ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif'].some(
      (ext) => name.endsWith(ext),
    )
  ) {
    return 'image';
  }
  if (['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'].some((ext) => name.endsWith(ext))) {
    return 'audio';
  }
  return 'file';
}

export function shouldUseChunkedVideoUpload(files: File[]): boolean {
  return files.some(
    (f) => f.type.startsWith('video/') && f.size >= VIDEO_CHUNK_UPLOAD_MIN_BYTES,
  );
}

async function parseJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * One file → one upload session; chunks uploaded in parallel (up to CHUNK_UPLOAD_PARALLELISM).
 */
async function uploadSingleFileChunks(
  file: File,
  chatId: number,
  onByteProgress: (loadedInThisFile: number) => void,
): Promise<string> {
  const initRes = await apiFetch('/api/messages/chunk/init/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      filename: file.name,
      mime_type: file.type || null,
      media_kind: getDeclaredMediaKind(file),
      total_size: file.size,
    }),
  });

  if (!initRes.ok) {
    const err = await parseJsonResponse(initRes);
    throw new Error(
      typeof err === 'object' && err !== null && 'error' in err
        ? String((err as { error: string }).error)
        : `chunk init failed: ${initRes.status}`,
    );
  }

  const initJson = (await initRes.json()) as {
    upload_id: string;
    chunk_count: number;
    chunk_size: number;
  };

  const { upload_id, chunk_count, chunk_size } = initJson;

  let nextIndex = 0;
  /** Sum of bytes uploaded for this file (chunks may finish out of order). */
  let bytesUploadedThisFile = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const i = nextIndex;
      nextIndex += 1;
      if (i >= chunk_count) {
        return;
      }
      const start = i * chunk_size;
      const end = Math.min(start + chunk_size, file.size);
      const chunkLen = end - start;
      const blob = file.slice(start, end);
      const fd = new FormData();
      fd.append('upload_id', upload_id);
      fd.append('chunk_index', String(i));
      fd.append('chunk', blob, `part${i}`);

      const partRes = await apiFetch('/api/messages/chunk/part/', {
        method: 'POST',
        body: fd,
      });

      if (!partRes.ok) {
        const err = await parseJsonResponse(partRes);
        throw new Error(
          typeof err === 'object' && err !== null && 'error' in err
            ? String((err as { error: string }).error)
            : `chunk part ${i} failed: ${partRes.status}`,
        );
      }

      bytesUploadedThisFile += chunkLen;
      onByteProgress(bytesUploadedThisFile);
    }
  }

  const workers = Math.min(CHUNK_UPLOAD_PARALLELISM, chunk_count);
  await Promise.all(Array.from({ length: workers }, () => worker()));

  return upload_id;
}

/**
 * Upload multiple files in parallel (each file has its own chunk session with parallel chunks).
 * One bundle request creates a single message.
 */
export async function uploadMessageFilesChunked(
  files: File[],
  chatId: number,
  messageText: string,
  onProgress?: (percent: number) => void,
): Promise<unknown> {
  console.info(
    '[chunked upload] start',
    files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      declaredKind: getDeclaredMediaKind(f),
    })),
  );
  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  const perFileLoaded = new Array<number>(files.length).fill(0);

  const uploadIds = await Promise.all(
    files.map((file, idx) =>
      uploadSingleFileChunks(file, chatId, (loadedInThisFile) => {
        perFileLoaded[idx] = loadedInThisFile;
        if (onProgress && totalBytes > 0) {
          const sumLoaded = perFileLoaded.reduce((a, b) => a + b, 0);
          onProgress(
            Math.min(100, Math.round((sumLoaded / totalBytes) * 100)),
          );
        }
      }),
    ),
  );

  console.info('[chunked upload] upload_ids', uploadIds);

  const completeRes = await apiFetch('/api/messages/chunk/complete/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message: messageText,
      upload_ids: uploadIds,
    }),
  });

  const data = await parseJsonResponse(completeRes);

  if (!completeRes.ok) {
    throw new Error(
      typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: string }).error)
        : `chunk complete failed: ${completeRes.status}`,
    );
  }

  onProgress?.(100);
  return data;
}
