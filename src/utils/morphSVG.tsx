function parsePath(d) {
  if (!d) return [];
  return d.match(/[A-Za-z]|-?\d*\.?\d+/g) || [];
}

function toCubic(pathD) {
  let x = 0,
    y = 0,
    startX = 0,
    startY = 0;
  const out = [];
  const p = parsePath(pathD);
  let i = 0;
  while (i < p.length) {
    const cmd = p[i++];
    if (cmd === 'M') {
      x = +p[i++];
      y = +p[i++];
      startX = x;
      startY = y;
      out.push(['M', x, y]);
    }
    if (cmd === 'L') {
      const x2 = +p[i++];
      const y2 = +p[i++];
      out.push(['C', x, y, x2, y2, x2, y2]);
      x = x2;
      y = y2;
    }
    if (cmd === 'Q') {
      const cx = +p[i++];
      const cy = +p[i++];
      const x2 = +p[i++];
      const y2 = +p[i++];
      out.push([
        'C',
        x + (2 / 3) * (cx - x),
        y + (2 / 3) * (cy - y),
        x2 + (2 / 3) * (cx - x2),
        y2 + (2 / 3) * (cy - y2),
        x2,
        y2,
      ]);
      x = x2;
      y = y2;
    }
    if (cmd === 'C') {
      out.push(['C', +p[i++], +p[i++], +p[i++], +p[i++], +p[i++], +p[i++]]);
      x = out[out.length - 1][5];
      y = out[out.length - 1][6];
    }
    if (cmd === 'T') {
      const x2 = +p[i++];
      const y2 = +p[i++];
      out.push(['C', x, y, x2, y2, x2, y2]);
      x = x2;
      y = y2;
    }
    if (cmd === 'A') {
      const rx = +p[i++],
        ry = +p[i++],
        xAxis = +p[i++];
      const largeArc = +p[i++],
        sweep = +p[i++];
      const x2 = +p[i++],
        y2 = +p[i++];

      const cubicSegs = arcToCubic(
        x,
        y,
        rx,
        ry,
        xAxis,
        largeArc,
        sweep,
        x2,
        y2,
      );
      out.push(...cubicSegs);
      x = x2;
      y = y2;
    }

    if (cmd === 'Z') {
      out.push(['C', x, y, startX, startY, startX, startY]);
      x = startX;
      y = startY;
    }
  }
  return out;
}

function normalizePaths(paths) {
  const maxLen = Math.max(1, ...paths.map((p) => p.length));

  return paths.map((p) => {
    const copy = [...p];
    while (copy.length < maxLen) copy.push(copy[copy.length - 1]);
    return copy;
  });
}

function interpolate(a, b, t) {
  return a.map((seg, i) =>
    seg.map((v, j) => (j === 0 ? v : v + (b[i][j] - v) * t)),
  );
}

function stringify(path) {
  return path.map((s) => s.join(' ')).join(' ');
}

function arcToCubic(x1, y1, rx, ry, angle, largeArcFlag, sweepFlag, x2, y2) {
  const rad = (angle * Math.PI) / 180;

  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  const dx2 = (x1 - x2) / 2;
  const dy2 = (y1 - y2) / 2;
  const x1p = cosA * dx2 + sinA * dy2;
  const y1p = -sinA * dx2 + cosA * dy2;

  let rx2 = rx * rx,
    ry2 = ry * ry,
    x1p2 = x1p * x1p,
    y1p2 = y1p * y1p;
  let radicant =
    (rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2) / (rx2 * y1p2 + ry2 * x1p2);
  radicant = Math.max(0, radicant);
  const coef = (largeArcFlag !== sweepFlag ? 1 : -1) * Math.sqrt(radicant);
  const cxp = coef * ((rx * y1p) / ry);
  const cyp = coef * ((-ry * x1p) / rx);

  const cx = cosA * cxp - sinA * cyp + (x1 + x2) / 2;
  const cy = sinA * cxp + cosA * cyp + (y1 + y2) / 2;

  function angleBetween(u, v) {
    const dot = u[0] * v[0] + u[1] * v[1];
    const len =
      Math.sqrt(u[0] * u[0] + u[1] * u[1]) *
      Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    let a = Math.acos(Math.min(Math.max(dot / len, -1), 1));
    if (u[0] * v[1] - u[1] * v[0] < 0) a = -a;
    return a;
  }

  const v1 = [(x1p - cxp) / rx, (y1p - cyp) / ry];
  const v2 = [(-x1p - cxp) / rx, (-y1p - cyp) / ry];
  let theta1 = angleBetween([1, 0], v1);
  let delta = angleBetween(v1, v2);

  if (!sweepFlag && delta > 0) delta -= 2 * Math.PI;
  else if (sweepFlag && delta < 0) delta += 2 * Math.PI;

  const segments = Math.ceil(Math.abs(delta / (Math.PI / 2)));
  const segDelta = delta / segments;
  const res = [];

  for (let i = 0; i < segments; i++) {
    const t1 = theta1 + i * segDelta;
    const t2 = t1 + segDelta;
    const alpha =
      (Math.sin(segDelta) *
        (Math.sqrt(4 + 3 * Math.tan(segDelta / 2) ** 2) - 1)) /
      3;

    const x1s = cx + rx * Math.cos(t1);
    const y1s = cy + ry * Math.sin(t1);
    const x2s = cx + rx * Math.cos(t2);
    const y2s = cy + ry * Math.sin(t2);

    const dx = alpha * rx * -Math.sin(t1);
    const dy = alpha * ry * Math.cos(t1);
    const dx2 = alpha * rx * Math.sin(t2);
    const dy2 = alpha * ry * -Math.cos(t2);

    res.push(['C', x1s + dx, y1s + dy, x2s + dx2, y2s + dy2, x2s, y2s]);
  }
  return res;
}
function startMorph(newTarget, pathEl) {
  if (!newTarget) return;

  const d = pathEl.getAttribute('d');
  if (!d) return;

  let currentPath = toCubic(d);
  let targetC = toCubic(newTarget);

  if (!currentPath.length || !targetC.length) return;

  [currentPath, targetC] = normalizePaths([currentPath, targetC]);

  const duration = 900;
  let startTime = null;

  function animate(time) {
    if (!startTime) startTime = time;
    const t = Math.min((time - startTime) / duration, 1);
    const eased = t * t * (3 - 2 * t);
    const frame = interpolate(currentPath, targetC, eased);
    pathEl.setAttribute('d', stringify(frame));

    if (t < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

import { useRef, useEffect } from 'react';

const MorphingIcon = ({ shape1, shape2, active }) => {
  const pathRef = useRef(null);

  useEffect(() => {
    if (!pathRef.current) return;

    const target = active ? shape2 : shape1;

    if (pathRef.current.getAttribute('d') === target) return;

    startMorph(target, pathRef.current);
  }, [active, shape1, shape2]);

  return (
    <svg viewBox='0 0 24 24'>
      <path ref={pathRef} d={shape1} fill='currentColor' />
    </svg>
  );
};

export default MorphingIcon;
