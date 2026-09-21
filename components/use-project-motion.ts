"use client";

import { useEffect, useRef, useState } from "react";

const THRESHOLD = 120;
const RETURN_DELAY = 80;

export function useProjectMotion(count: number) {
  const [selected, setSelected] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const explorerRef = useRef<HTMLElement>(null);
  const selectRef = useRef<(index: number) => void>(() => {});
  const selectedRef = useRef(0);

  useEffect(() => {
    const stage = stageRef.current;
    const explorer = explorerRef.current;
    if (!stage || !explorer) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current = selectedRef.current;
    let distance = 0;
    let queuedDistance = 0;
    let switching = false;
    let animation: Animation | null = null;
    let releaseTimer = 0;
    let frame = 0;

    function paint(y = 0, opacity = 1) {
      stage!.style.transform = `translate3d(0, ${y}px, 0)`;
      stage!.style.opacity = String(opacity);
    }

    function freeze() {
      if (!animation) return;
      const appearance = getComputedStyle(stage!);
      const transform = appearance.transform;
      const opacity = appearance.opacity;
      animation.cancel();
      animation = null;
      stage!.style.transform = transform;
      stage!.style.opacity = opacity;
    }

    function play(frames: Keyframe[], duration: number, finish: () => void) {
      const next = stage!.animate(frames, { duration, easing: "cubic-bezier(.22,.8,.25,1)", fill: "forwards" });
      animation = next;
      next.onfinish = () => {
        if (animation !== next) return;
        animation = null;
        finish();
        next.cancel();
      };
    }

    function settle() {
      window.clearTimeout(releaseTimer);
      releaseTimer = 0;
      distance = 0;
      queuedDistance = 0;
      if (switching) return;
      freeze();
      if (motion.matches) { paint(); return; }
      play([
        { transform: stage!.style.transform, opacity: stage!.style.opacity },
        { transform: "translate3d(0, 0, 0)", opacity: 1 },
      ], 360, () => paint());
    }

    function selectProject(index: number) {
      const next = Math.max(0, Math.min(count - 1, index));
      if (switching) return;
      if (next === current) { settle(); return; }
      window.clearTimeout(releaseTimer);
      freeze();
      distance = 0;
      queuedDistance = 0;
      if (motion.matches) {
        current = next;
        selectedRef.current = next;
        setSelected(next);
        paint();
        return;
      }
      switching = true;
      const direction = Math.sign(next - current);
      const moveFocus = stage!.contains(document.activeElement);
      play([
        { transform: stage!.style.transform || "translate3d(0, 0, 0)", opacity: stage!.style.opacity || 1 },
        { transform: `translate3d(0, ${-direction * 85}px, 0)`, opacity: 0 },
      ], 190, () => {
        current = next;
        selectedRef.current = next;
        paint(direction * 65, 0);
        setSelected(next);
        // Let React replace the contents while the card is invisible.
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            play([
              { transform: `translate3d(0, ${direction * 65}px, 0)`, opacity: 0 },
              { transform: "translate3d(0, 0, 0)", opacity: 1 },
            ], 340, () => {
              paint();
              switching = false;
              if (moveFocus) stage!.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])')?.focus({ preventScroll: true });
              const pending = queuedDistance;
              queuedDistance = 0;
              if (pending) drag(pending);
            });
          });
        });
      });
    }
    selectRef.current = selectProject;

    function drag(delta: number) {
      if (switching) {
        // Carry ongoing input into the next card, but never build a long queue.
        queuedDistance = Math.max(-THRESHOLD, Math.min(THRESHOLD, queuedDistance + delta));
        return;
      }
      freeze();
      distance += delta;
      const direction = Math.sign(distance);
      const atEdge = current + direction < 0 || current + direction >= count;
      const progress = Math.min(Math.abs(distance) / THRESHOLD, 1);
      if (!motion.matches) paint(-distance * (atEdge ? .12 : .55), 1 - progress * (atEdge ? .08 : .3));
      if (!atEdge && Math.abs(distance) >= THRESHOLD) selectProject(current + direction);
      else if (atEdge) distance = Math.max(-THRESHOLD, Math.min(THRESHOLD, distance));
    }

    function canCapture() {
      // Do not trap enlarged text or content that exceeds a short viewport.
      return document.documentElement.scrollHeight <= window.innerHeight + 2;
    }

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY || !canCapture()) return;
      event.preventDefault();
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      // A large mouse-wheel notch should still show the pull before committing.
      drag(Math.max(-65, Math.min(65, pixels)));
      window.clearTimeout(releaseTimer);
      // This timer only returns a partial drag; it never unlocks navigation.
      releaseTimer = window.setTimeout(settle, RETURN_DELAY);
    }

    let touch: { x: number; y: number; lastY: number } | null = null;
    function onTouchStart(event: TouchEvent) {
      touch = null;
      if (event.touches.length !== 1 || switching || !canCapture()) return;
      window.clearTimeout(releaseTimer);
      distance = 0;
      queuedDistance = 0;
      const point = event.touches[0];
      touch = { x: point.clientX, y: point.clientY, lastY: point.clientY };
    }
    function onTouchMove(event: TouchEvent) {
      if (!touch) return;
      if (event.touches.length !== 1) { touch = null; settle(); return; }
      const point = event.touches[0];
      if (Math.abs(point.clientX - touch.x) > Math.abs(point.clientY - touch.y)) return;
      event.preventDefault();
      drag(touch.lastY - point.clientY);
      touch.lastY = point.clientY;
    }
    function onTouchEnd() { touch = null; settle(); }

    window.addEventListener("wheel", onWheel, { passive: false });
    explorer.addEventListener("touchstart", onTouchStart, { passive: true });
    explorer.addEventListener("touchmove", onTouchMove, { passive: false });
    explorer.addEventListener("touchend", onTouchEnd);
    explorer.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.clearTimeout(releaseTimer);
      cancelAnimationFrame(frame);
      animation?.cancel();
      paint();
      selectRef.current = () => {};
      window.removeEventListener("wheel", onWheel);
      explorer.removeEventListener("touchstart", onTouchStart);
      explorer.removeEventListener("touchmove", onTouchMove);
      explorer.removeEventListener("touchend", onTouchEnd);
      explorer.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [count]);

  return { selected, stageRef, explorerRef, selectProject: (index: number) => selectRef.current(index) };
}
