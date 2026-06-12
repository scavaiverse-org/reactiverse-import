import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
// Cloudflare's published test site key — always passes, safe to ship as a fallback for local/dev use.
const DEFAULT_TEST_SITE_KEY = "1x00000000000000000000AA";

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();
  if (!window.__turnstileLoadPromise) {
    window.__turnstileLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Turnstile"));
      document.head.appendChild(script);
    });
  }
  return window.__turnstileLoadPromise;
}

const TurnstileWidget = forwardRef(function TurnstileWidget({ onVerify, onExpire, className }, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;

  useEffect(() => {
    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || DEFAULT_TEST_SITE_KEY,
          theme: "auto",
          callback: (token) => onVerifyRef.current?.(token),
          "expired-callback": () => onExpireRef.current?.(),
          "error-callback": () => onExpireRef.current?.(),
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }), []);

  return <div ref={containerRef} className={className} />;
});

export default TurnstileWidget;
