"use client";

import { useEffect, useRef, useState } from "react";
import { nearestPosition, releaseTarget, springStep, wheelAppearance, wheelDistance, wrapIndex } from "@/lib/strategy-wheel";

type Selection = { index: number; direction: number };
type Drag = { id: number; lastY: number; startY: number; lastTime: number; velocity: number; moved: boolean; item: number | null };

export function useStrategyWheel(count: number) {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [selection, setSelection] = useState<Selection>({ index: 0, direction: 1 });

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !count) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let position = 0, target = 0, velocity = 0, selectedStep = 0;
    let expansion = 0, expansionVelocity = 0, expansionTarget = 0;
    let frame = 0, lastFrame = 0, hoverTimer = 0, closeTimer = 0, wheelTimer = 0;
    let hovered = false, focused = false, scrolling = false;
    let pendingFocus: number | null = null;
    let drag: Drag | null = null;
    let row = parseFloat(getComputedStyle(root).getPropertyValue("--wheel-step")) || 80;

    function paint() {
      // Selection follows the visible position, with a small dead band at the midpoint.
      if (Math.abs(position - selectedStep) > .55) {
        const next = Math.round(position);
        const direction = Math.sign(next - selectedStep);
        const changed = wrapIndex(next, count) !== wrapIndex(selectedStep, count);
        selectedStep = next;
        if (changed) setSelection({ index: wrapIndex(next, count), direction });
      }
      itemRefs.current.forEach((item, index) => {
        if (!item) return;
        const distance = wheelDistance(index, position, count);
        const appearance = wheelAppearance(distance, expansion);
        // Resize the actual type so the browser rerasterizes glyphs at their final size.
        // Scaling a permanently composited text layer softens its edges on hover.
        item.style.setProperty("--wheel-type-scale", appearance.scale.toFixed(4));
        item.style.transform = `translate(${appearance.x * row}px, calc(${appearance.y * row}px - 50%)) rotate(${appearance.angle}deg)`;
        item.style.opacity = String(appearance.opacity);
        item.style.filter = reduced.matches || appearance.blur < .01 ? "none" : `blur(${appearance.blur}px)`;
        item.style.pointerEvents = appearance.opacity > .08 ? "auto" : "none";
        item.style.visibility = Math.abs(distance) < 2.5 ? "visible" : "hidden";
      });
      root!.style.setProperty("--wheel-expansion", String(expansion));
    }

    function tick(now: number) {
      const dt = Math.min((now - lastFrame) / 1000, .05);
      lastFrame = now;
      if (!drag && !scrolling) {
        if (reduced.matches) { position = target; velocity = 0; }
        else ({ position, velocity } = springStep(position, velocity, target, dt));
        if (Math.abs(target - position) < .0005 && Math.abs(velocity) < .005) { position = target; velocity = 0; }
      }
      if (reduced.matches) { expansion = expansionTarget; expansionVelocity = 0; }
      else {
        const zoom = springStep(expansion, expansionVelocity, expansionTarget, dt, 15);
        expansion = zoom.position;
        expansionVelocity = zoom.velocity;
        if (Math.abs(expansion - expansionTarget) < .0005 && Math.abs(expansionVelocity) < .005) { expansion = expansionTarget; expansionVelocity = 0; }
      }
      paint();
      if (pendingFocus !== null && Math.abs(position - target) < .01) {
        itemRefs.current[pendingFocus]?.focus({ preventScroll: true });
        pendingFocus = null;
      }
      const moving = (!drag && !scrolling && (position !== target || velocity !== 0)) || expansion !== expansionTarget || expansionVelocity !== 0;
      frame = moving ? requestAnimationFrame(tick) : 0;
    }
    function wake() {
      if (frame) return;
      lastFrame = performance.now();
      frame = requestAnimationFrame(tick);
    }
    function expand() {
      clearTimeout(closeTimer);
      clearTimeout(hoverTimer);
      expansionTarget = 1;
      root!.dataset.expanded = "true";
      wake();
    }
    function collapse() {
      clearTimeout(closeTimer);
      if (hovered || focused || drag || scrolling) return;
      closeTimer = window.setTimeout(() => {
        expansionTarget = 0;
        root!.dataset.expanded = "false";
        wake();
      }, 140);
    }
    function snap() {
      scrolling = false;
      target = Math.round(position);
      velocity = 0;
      wake();
      collapse();
    }
    function choose(index: number) {
      clearTimeout(wheelTimer);
      scrolling = false;
      target = nearestPosition(index, position, count);
      velocity = 0;
      wake();
    }
    function itemIndex(target: EventTarget | null) {
      const item = target instanceof Element ? target.closest<HTMLElement>("[data-wheel-index]") : null;
      return item ? Number(item.dataset.wheelIndex) : null;
    }
    function onEnter(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      hovered = true;
      clearTimeout(closeTimer);
      hoverTimer = window.setTimeout(expand, 240);
    }
    function onLeave() {
      hovered = false;
      clearTimeout(hoverTimer);
      collapse();
    }
    function onDown(event: PointerEvent) {
      if (!event.isPrimary || event.button !== 0 || drag) return;
      clearTimeout(wheelTimer);
      scrolling = false;
      target = position;
      velocity = 0;
      pendingFocus = null;
      drag = { id: event.pointerId, startY: event.clientY, lastY: event.clientY, lastTime: performance.now(), velocity: 0, moved: false, item: itemIndex(event.target) };
      root!.setPointerCapture(event.pointerId);
      root!.dataset.dragging = "true";
      expand();
    }
    function onMove(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id) return;
      const now = performance.now();
      const delta = (drag.lastY - event.clientY) / (row * (1 + expansion * .14));
      const dt = Math.max((now - drag.lastTime) / 1000, .008);
      if (Math.abs(event.clientY - drag.startY) > 3) drag.moved = true;
      drag.velocity = drag.velocity * .35 + Math.max(-12, Math.min(12, delta / dt)) * .65;
      drag.lastY = event.clientY;
      drag.lastTime = now;
      if (!drag.moved) return;
      event.preventDefault();
      // No easing while held: one input delta maps directly to one visual delta.
      position += delta;
      target = position;
      paint();
    }
    function finish(event: PointerEvent, cancelled = false) {
      if (!drag || drag.id !== event.pointerId) return;
      const released = drag;
      drag = null;
      root!.dataset.dragging = "false";
      if (root!.hasPointerCapture(event.pointerId)) root!.releasePointerCapture(event.pointerId);
      if (!cancelled && !released.moved && released.item !== null) {
        choose(released.item);
        itemRefs.current[released.item]?.focus({ preventScroll: true });
      } else {
        velocity = !cancelled && performance.now() - released.lastTime < 80 ? released.velocity : 0;
        target = cancelled ? Math.round(position) : releaseTarget(position, velocity);
        // A captured drag must not leave keyboard focus on an offscreen item.
        root!.focus({ preventScroll: true });
        wake();
      }
      if (event.pointerType === "touch") hovered = false;
      collapse();
    }
    function onUp(event: PointerEvent) { finish(event); }
    function onCancel(event: PointerEvent) { finish(event, true); }
    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || event.metaKey || drag || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
      event.preventDefault();
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root!.clientHeight : 1);
      scrolling = true;
      pendingFocus = null;
      velocity = 0;
      position += Math.max(-1, Math.min(1, pixels / (row * 1.25)));
      target = position;
      expand();
      paint();
      clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(snap, 100);
    }
    function onKey(event: KeyboardEvent) {
      let next = Math.round(target);
      if (["ArrowDown", "ArrowRight"].includes(event.key)) next++;
      else if (["ArrowUp", "ArrowLeft"].includes(event.key)) next--;
      else if (event.key === "Home") next = nearestPosition(0, position, count);
      else if (event.key === "End") next = nearestPosition(count - 1, position, count);
      else return;
      event.preventDefault();
      clearTimeout(wheelTimer);
      scrolling = false;
      target = next;
      velocity = 0;
      pendingFocus = wrapIndex(next, count);
      const item = itemRefs.current[pendingFocus];
      if (item?.style.visibility !== "hidden") item?.focus({ preventScroll: true });
      else root!.focus({ preventScroll: true });
      expand();
      wake();
    }
    function onClick(event: MouseEvent) {
      // Pointer clicks are handled on release; retain native keyboard/AT activation.
      if (event.detail !== 0) return;
      const index = itemIndex(event.target);
      if (index !== null) choose(index);
    }
    function onFocus(event: FocusEvent) {
      // Pointer focus should not keep the wheel open after the pointer has left.
      const target = event.target as HTMLElement;
      focused = target.matches(":focus-visible");
      if (focused) expand();
    }
    function onBlur(event: FocusEvent) {
      if (root!.contains(event.relatedTarget as Node)) return;
      focused = false;
      collapse();
    }
    function onResize() {
      row = parseFloat(getComputedStyle(root!).getPropertyValue("--wheel-step")) || 80;
      paint();
    }
    const resize = new ResizeObserver(onResize);
    resize.observe(root);
    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onCancel);
    root.addEventListener("lostpointercapture", onCancel);
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("keydown", onKey);
    root.addEventListener("click", onClick);
    root.addEventListener("focusin", onFocus);
    root.addEventListener("focusout", onBlur);
    reduced.addEventListener("change", wake);
    paint();
    return () => {
      cancelAnimationFrame(frame);
      [hoverTimer, closeTimer, wheelTimer].forEach(clearTimeout);
      resize.disconnect();
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onCancel);
      root.removeEventListener("lostpointercapture", onCancel);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("keydown", onKey);
      root.removeEventListener("click", onClick);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", onBlur);
      reduced.removeEventListener("change", wake);
    };
  }, [count]);

  return { rootRef, itemRefs, selection };
}
