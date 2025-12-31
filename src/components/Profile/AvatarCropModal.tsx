import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
} from 'react';
import ReactDOM from 'react-dom';
import styles from './AvatarCropModal.module.scss';
import { apiUpload } from '@/utils/apiFetch';

interface AvatarCropModalProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  profileId: number;
}

type Edge =
  | 'inside'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | null;

export default function AvatarCropModal({
  file,
  isOpen,
  onClose,
  onUploadSuccess,
  profileId,
}: AvatarCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const needsRedrawRef = useRef(false);
  const imgPosRef = useRef({ x: 0, y: 0 });
  const imgScaleRef = useRef(1);
  const isDraggingRef = useRef(false);

  const [selection, setSelection] = useState({ x: 150, y: 150, size: 200 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const [imgScale, setImgScale] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(400);
  const [cursor, setCursor] = useState('default');
  const [activeEdge, setActiveEdge] = useState<Edge>(null);

  const CANVAS_HEIGHT = 400;
  const MIN_SIZE = 100;
  const MIN_WIDTH = MIN_SIZE;
  const HANDLE_SIZE = 20;
  const CORNER_RADIUS = 4;
  const DETECT_B = 12;
  const MAX_SIZE = 400;
  const LINEWIDTH = 3;
  const FRAME = LINEWIDTH;

  const selectionRef = useRef({ x: 0, y: 0, size: 200 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const activeEdgeRef = useRef<Edge>(null);

  const ratioRef = useRef<number>(window.devicePixelRatio || 1);
  const getRatio = useCallback(() => ratioRef.current, []);

  useEffect(() => {
    selectionRef.current = selection;
    offsetRef.current = offset;
    activeEdgeRef.current = activeEdge;
    imgPosRef.current = imgPos;
    imgScaleRef.current = imgScale;
  }, [selection, offset, activeEdge, imgPos, imgScale]);

  useEffect(() => {
    if (!isOpen || !file) return;

    const url = URL.createObjectURL(file);
    const img = imageRef.current;
    img.src = url;

    img.onload = () => {
      const scale = CANVAS_HEIGHT / img.height;
      let width = img.width * scale;

      if (width < MIN_WIDTH) {
        width = MIN_WIDTH;
      }

      const autoSize = Math.max(MIN_SIZE, Math.min(400, width, CANVAS_HEIGHT));

      const x = (width - img.width * scale) / 2;
      const y = (CANVAS_HEIGHT - img.height * scale) / 2;

      imgScaleRef.current = scale;
      imgPosRef.current = { x, y };
      selectionRef.current = {
        x: (width - autoSize) / 2,
        y: (CANVAS_HEIGHT - autoSize) / 2,
        size: autoSize,
      };

      setImgScale(scale);
      setCanvasWidth(width);
      setImgPos(imgPosRef.current);
      setSelection(selectionRef.current);
    };

    return () => URL.revokeObjectURL(url);
  }, [file, isOpen]);

  const createMask = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = getRatio();
    const totalWidth = canvas.width / ratio;
    const totalHeight = canvas.height / ratio;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d')!;

    maskCtx.scale(ratio, ratio);

    maskCtx.clearRect(0, 0, totalWidth, totalHeight);

    maskCtx.fillStyle = 'rgba(0,0,0,0.6)';
    const img = imageRef.current;
    const imgWidth = img.width * imgScaleRef.current;
    const imgHeight = img.height * imgScaleRef.current;

    maskCtx.fillRect(
      FRAME + imgPosRef.current.x,
      FRAME + imgPosRef.current.y,
      imgWidth,
      imgHeight
    );

    const sel = selectionRef.current;
    const cx = FRAME + sel.x + sel.size / 2;
    const cy = FRAME + sel.y + sel.size / 2;
    const radius = sel.size / 2;

    maskCtx.globalCompositeOperation = 'destination-out';
    maskCtx.beginPath();
    maskCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    maskCtx.fill();

    maskCtx.globalCompositeOperation = 'source-over';

    maskCanvasRef.current = maskCanvas;
  }, [getRatio, canvasWidth]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;
    console.log('drawCanvas');

    const ctx = canvas.getContext('2d')!;
    const ratio = getRatio();

    ctx.resetTransform();
    ctx.clearRect(-10, -10, canvas.width + 20, canvas.height + 20);

    ctx.setTransform(ratio, 0, 0, ratio, FRAME * ratio, FRAME * ratio);

    const img = imageRef.current;
    const imgWidth = img.width * imgScaleRef.current;
    const imgHeight = img.height * imgScaleRef.current;
    ctx.drawImage(
      img,
      imgPosRef.current.x,
      imgPosRef.current.y,
      imgWidth,
      imgHeight
    );

    createMask();
    if (maskCanvasRef.current) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(maskCanvasRef.current!, 0, 0);
      ctx.restore();
    }

    const sel = selectionRef.current;
    const handleSize = HANDLE_SIZE;
    const cornerRadius = CORNER_RADIUS;
    ctx.fillStyle = '#fff';
    const o = LINEWIDTH;

    // Top-left horizontal
    ctx.beginPath();
    ctx.roundRect(sel.x - o, sel.y - o, handleSize, LINEWIDTH, cornerRadius);
    ctx.fill();

    // Top-left vertical
    ctx.beginPath();
    ctx.roundRect(sel.x - o, sel.y - o, LINEWIDTH, handleSize, cornerRadius);
    ctx.fill();

    // Top-right
    ctx.beginPath();
    ctx.roundRect(
      sel.x + sel.size - handleSize + o,
      sel.y - o,
      handleSize,
      LINEWIDTH,
      cornerRadius
    );
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(
      sel.x + sel.size,
      sel.y - o,
      LINEWIDTH,
      handleSize,
      cornerRadius
    );
    ctx.fill();

    // Bottom-left
    ctx.beginPath();
    ctx.roundRect(
      sel.x - o,
      sel.y + sel.size,
      handleSize,
      LINEWIDTH,
      cornerRadius
    );
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(
      sel.x - o,
      sel.y + sel.size - handleSize + o,
      LINEWIDTH,
      handleSize,
      cornerRadius
    );
    ctx.fill();

    // Bottom-right
    ctx.beginPath();
    ctx.roundRect(
      sel.x + sel.size - handleSize + o,
      sel.y + sel.size,
      handleSize,
      LINEWIDTH,
      cornerRadius
    );
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(
      sel.x + sel.size,
      sel.y + sel.size - handleSize + o,
      LINEWIDTH,
      handleSize,
      cornerRadius
    );
    ctx.fill();
  }, []);

  const scheduleRedraw = useCallback(() => {
    needsRedrawRef.current = true;
    if (!rafRef.current && canvasRef.current) {
      rafRef.current = requestAnimationFrame(rafLoop);
    }
  }, []);

  const rafLoop = useCallback(() => {
    if (!needsRedrawRef.current) {
      rafRef.current = 0;
      return;
    }
    drawCanvas();
    needsRedrawRef.current = false;
    rafRef.current = requestAnimationFrame(rafLoop);
  }, []);

  const detectEdge = useCallback((x: number, y: number): Edge => {
    const sel = selectionRef.current;
    const b = DETECT_B + LINEWIDTH;

    const topLeftZone =
      x >= sel.x - 2 && x <= sel.x + b && y >= sel.y - 2 && y <= sel.y + b;
    const topRightZone =
      x >= sel.x + sel.size - b &&
      x <= sel.x + sel.size + 2 &&
      y >= sel.y - 2 &&
      y <= sel.y + b;
    const bottomLeftZone =
      x >= sel.x - 2 &&
      x <= sel.x + b &&
      y >= sel.y + sel.size - b &&
      y <= sel.y + sel.size + 2;
    const bottomRightZone =
      x >= sel.x + sel.size - b &&
      x <= sel.x + sel.size + 2 &&
      y >= sel.y + sel.size - b &&
      y <= sel.y + sel.size + 2;

    const isInsideCrop =
      x >= sel.x &&
      x <= sel.x + sel.size &&
      y >= sel.y &&
      y <= sel.y + sel.size;

    if (topLeftZone) return 'topLeft';
    if (topRightZone) return 'topRight';
    if (bottomLeftZone) return 'bottomLeft';
    if (bottomRightZone) return 'bottomRight';

    if (isInsideCrop) return 'inside';

    return null;
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ratio = getRatio();
    const totalWidth = canvasWidth + FRAME * 2;
    const totalHeight = CANVAS_HEIGHT + FRAME * 2;

    if (
      canvas.width !== totalWidth * ratio ||
      canvas.height !== totalHeight * ratio
    ) {
      canvas.width = totalWidth * ratio;
      canvas.height = totalHeight * ratio;
      canvas.style.width = `${totalWidth}px`;
      canvas.style.height = `${totalHeight}px`;

      requestAnimationFrame(() => drawCanvas());
    }
  }, [isOpen, canvasWidth]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - FRAME;
      const y = e.clientY - rect.top - FRAME;

      const edge = detectEdge(x, y);

      const cursorMap: Record<Edge, string> = {
        inside: activeEdgeRef.current ? 'none' : 'all-scroll',
        topLeft: 'nwse-resize',
        topRight: 'nesw-resize',
        bottomLeft: 'nesw-resize',
        bottomRight: 'nwse-resize',
      };
      setCursor(edge ? cursorMap[edge] : 'default');
    },
    [detectEdge]
  );

  const onGlobalMove = useCallback(
    (e: MouseEvent) => {
      const edge = activeEdgeRef.current;
      if (!edge || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - FRAME;
      const y = e.clientY - rect.top - FRAME;

      const off = offsetRef.current;
      const prev = selectionRef.current;
      let { x: px, y: py, size } = prev;

      const dx = x - (px + size);
      const dy = y - (py + size);

      switch (edge) {
        case 'inside':
          px = Math.min(Math.max(0, x - off.x), canvasWidth - size);
          py = Math.min(Math.max(0, y - off.y), CANVAS_HEIGHT - size);
          break;

        case 'topLeft': {
          let deltaX = px - x;
          let deltaY = py - y;
          let newSize = Math.max(
            MIN_SIZE,
            Math.min(size + deltaX, size + deltaY, px + size, py + size)
          );
          px = px + (size - newSize);
          py = py + (size - newSize);
          size = newSize;
          break;
        }

        case 'topRight': {
          let deltaX = x - (px + size);
          let deltaY = py - y;
          let newSize = Math.max(
            MIN_SIZE,
            Math.min(size + deltaY, size + deltaX, canvasWidth - px, py + size)
          );
          py = py + (size - newSize);
          size = newSize;
          break;
        }

        case 'bottomLeft': {
          const delta = Math.min(px - x, y - (py + size));
          const newSize = Math.max(
            MIN_SIZE,
            Math.min(size + delta, canvasWidth - px + delta, CANVAS_HEIGHT - py)
          );
          px = px + (size - newSize);
          size = newSize;
          break;
        }

        case 'bottomRight': {
          const delta = Math.min(x - (px + size), y - (py + size));
          const newSize = Math.max(
            MIN_SIZE,
            Math.min(size + delta, canvasWidth - px, CANVAS_HEIGHT - py)
          );
          size = newSize;
          break;
        }
      }

      const newSel = {
        x: Math.max(0, Math.min(px, canvasWidth - size)),
        y: Math.max(0, Math.min(py, CANVAS_HEIGHT - size)),
        size: Math.max(MIN_SIZE, Math.min(size, MAX_SIZE)),
      };
      selectionRef.current = newSel;
      scheduleRedraw();
    },
    [canvasWidth, scheduleRedraw]
  );

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - FRAME;
      const y = e.clientY - rect.top - FRAME;

      const edge = detectEdge(x, y);
      if (!edge) return;

      setActiveEdge(edge);
      setOffset({
        x: x - selectionRef.current.x,
        y: y - selectionRef.current.y,
      });
      isDraggingRef.current = true;

      window.addEventListener('mousemove', onGlobalMove);
      window.addEventListener('mouseup', endDrag);
    },
    [detectEdge, onGlobalMove]
  );

  const endDrag = useCallback(
    (e: MouseEvent) => {
      e?.preventDefault();
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 0);
      setActiveEdge(null);
      setSelection(selectionRef.current);
      window.removeEventListener('mousemove', onGlobalMove);
      window.removeEventListener('mouseup', endDrag);
      scheduleRedraw();
    },
    [onGlobalMove, scheduleRedraw, setSelection]
  );

  const handleUpload = useCallback(async () => {
    const sel = selectionRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = sel.size;
    canvas.height = sel.size;
    const ctx = canvas.getContext('2d')!;

    const img = imageRef.current;
    const sx = (sel.x - imgPosRef.current.x) / imgScaleRef.current;
    const sy = (sel.y - imgPosRef.current.y) / imgScaleRef.current;
    const sSize = sel.size / imgScaleRef.current;

    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, sel.size, sel.size);

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), 'image/webp', 0.95)
    );

    const formData = new FormData();
    formData.append(
      'file',
      new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'))
    );

    try {
      const data = await apiUpload(
        `/api/media_files/primary-media/?content_type=profile&object_id=${profileId}`,
        formData
      );
      console.log('Upload success:', data);
      onUploadSuccess();
      onClose();
    } catch (e) {
      console.error('Upload failed:', e);
    }
  }, [file.name, profileId, onUploadSuccess, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className={styles.modalOverlay}
      onClick={() => {
        if (!isDraggingRef.current) {
          onClose();
        }
      }}
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrag}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setCursor('default')}
          className={styles.canvas}
          style={{ cursor }}
        />
        <div className={styles.buttons}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleUpload}>Save</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
