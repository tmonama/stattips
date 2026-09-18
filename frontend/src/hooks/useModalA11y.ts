import { useEffect, type RefObject } from "react";

export function useModalA11y(ref: RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusables = node?.querySelectorAll<HTMLElement>(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "Tab" && focusables?.length) {
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [ref, onClose]);
}