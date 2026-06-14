import { useEffect } from "react";

let lockCount = 0;
let previousOverflow = "";

function lockBodyScroll() {
  if (lockCount === 0) previousOverflow = document.body.style.overflow;
  lockCount += 1;
  document.body.style.overflow = "hidden";
}

function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.style.overflow = previousOverflow;
}

// Shared full-screen overlay behaviour: locks body scroll (ref-counted so
// stacked overlays restore the original value correctly) and closes on Escape.
export default function useModalOverlay(onClose) {
  useEffect(() => {
    lockBodyScroll();
    return unlockBodyScroll;
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
}
