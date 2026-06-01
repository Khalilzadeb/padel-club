"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drag-to-reposition logic for a cover/banner image.
 *
 * The frame stays a fixed size and the image is cropped (`object-cover` /
 * `background-size: cover`). This hook tracks a vertical focal point (0-100%)
 * that the admin can adjust by dragging the image up/down. Dragging down
 * reveals more of the top of the image (focal point moves toward 0%), which
 * matches the natural "grab and pull" feel.
 *
 * Apply `position` via `object-position: center {position}%` (for <img>) or
 * `background-position: center {position}%` (for background images).
 *
 * `onCommit` fires once on pointer release, only when the value changed, so
 * callers can persist the new position without spamming the network on every
 * pixel of movement.
 */
export function useCoverDrag(initial: number, onCommit: (position: number) => void) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState(initial);
  const [repositioning, setRepositioning] = useState(false);

  // Latest position in a ref so the pointer-up handler reads the final value
  // without relying on a possibly-stale closure.
  const posRef = useRef(initial);
  const savedRef = useRef(initial);
  const dragRef = useRef<{ startY: number; startPos: number } | null>(null);

  // Keep in sync when the source position changes (e.g. after a new upload).
  useEffect(() => {
    setPosition(initial);
    posRef.current = initial;
    savedRef.current = initial;
  }, [initial]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { startY: e.clientY, startPos: posRef.current };
    },
    []
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !frameRef.current) return;
    const h = frameRef.current.clientHeight || 1;
    const deltaY = e.clientY - dragRef.current.startY;
    const next = Math.min(100, Math.max(0, dragRef.current.startPos - (deltaY / h) * 100));
    posRef.current = next;
    setPosition(next);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    const rounded = Math.round(posRef.current);
    if (rounded !== savedRef.current) {
      savedRef.current = rounded;
      onCommit(rounded);
    }
  }, [onCommit]);

  // Spread onto the draggable overlay element.
  const overlayProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  };

  return { frameRef, position, repositioning, setRepositioning, overlayProps };
}
