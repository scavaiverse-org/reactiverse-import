import { getElementLabel, getElementSelector } from "./runtime-capture";
import { recordSentinelEvent, upsertIssueFromFailure } from "./issue-lifecycle";

let installed = false;
let internalCapture = false;
const recent = new Map();

function shouldRecord(key, ttl = 3000) {
  const now = Date.now();
  const last = recent.get(key) || 0;
  if (now - last < ttl) return false;
  recent.set(key, now);
  return true;
}

function safeAsync(task) {
  internalCapture = true;
  task().catch(() => {}).finally(() => {
    internalCapture = false;
  });
}

function toSafeString(value) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function startSentinelRuntimeCapture() {
  if (installed || typeof window === "undefined") return () => {};
  installed = true;

  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError(...args);
    const message = args.map(toSafeString).join(" ").slice(0, 1000);
    if (!shouldRecord(`console:${window.location.pathname}:${message}`, 8000)) return;
    safeAsync(async () => {
      await recordSentinelEvent({ event_type: "console_error", route: window.location.pathname, message, severity: "critical", metadata: { source: "console.error" } });
      await upsertIssueFromFailure({ route: window.location.pathname, message, console_errors: [message], issue_type: "console_error", severity: "major", component_name: "console" });
    });
  };

  const onError = (event) => {
    const message = event.message || "Window runtime error";
    if (!shouldRecord(`error:${window.location.pathname}:${message}`, 8000)) return;
    safeAsync(async () => {
      await recordSentinelEvent({ event_type: "render_error", route: window.location.pathname, message, severity: "critical", metadata: { filename: event.filename, line: event.lineno } });
      await upsertIssueFromFailure({ route: window.location.pathname, message, console_errors: [message], issue_type: "runtime_exception", severity: "critical", component_name: "window" });
    });
  };

  const onUnhandled = (event) => {
    const message = event.reason?.message || String(event.reason || "Unhandled promise rejection");
    if (!shouldRecord(`promise:${window.location.pathname}:${message}`, 8000)) return;
    safeAsync(async () => {
      await recordSentinelEvent({ event_type: "render_error", route: window.location.pathname, message, severity: "critical", metadata: { source: "unhandledrejection" } });
      await upsertIssueFromFailure({ route: window.location.pathname, message, console_errors: [message], issue_type: "unhandledrejection", severity: "major", component_name: "promise" });
    });
  };

  const onClick = (event) => {
    const target = event.target.closest?.("button,a[href],[role='button'],input[type='submit'],[data-sentinel-id],[data-testid]");
    if (!target) return;
    const label = getElementLabel(target);
    const selector = getElementSelector(target);
    const key = `click:${window.location.pathname}:${selector}:${label}`;
    if (!shouldRecord(key, 2000)) return;
    safeAsync(() => recordSentinelEvent({
      event_type: label.toLowerCase().includes("save") ? "save_attempt" : label.toLowerCase().includes("upload") ? "upload_attempt" : "click",
      route: window.location.pathname,
      target_label: label,
      target_selector: selector,
      message: `User clicked ${label || selector}`,
      severity: "info",
      metadata: { href: target.getAttribute("href") || "", disabled: !!target.disabled }
    }));
  };

  const onSubmit = (event) => {
    const label = event.target.getAttribute("aria-label") || event.target.id || "form";
    safeAsync(() => recordSentinelEvent({ event_type: "form_submit", route: window.location.pathname, target_label: label, message: `Form submitted: ${label}`, severity: "info" }));
  };

  const onMediaError = (event) => {
    const node = event.target;
    if (!node || !["IMG", "VIDEO"].includes(node.tagName)) return;
    const message = `${node.tagName.toLowerCase()} failed to load`;
    if (!shouldRecord(`media:${window.location.pathname}:${node.currentSrc || node.src}`, 10000)) return;
    safeAsync(async () => {
      await recordSentinelEvent({ event_type: "render_error", route: window.location.pathname, message, severity: "warning", metadata: { tag: node.tagName, src: node.currentSrc || node.src } });
      await upsertIssueFromFailure({ route: window.location.pathname, message: "Media upload saved but frontend does not render", issue_type: "media_binding", severity: "major", component_name: node.tagName.toLowerCase(), evidence: { src: node.currentSrc || node.src } });
    });
  };

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (!internalCapture && response.status >= 400) {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url;
      const message = `API failed with ${response.status}`;
      if (shouldRecord(`fetch:${window.location.pathname}:${url}:${response.status}`, 8000)) {
        safeAsync(async () => {
          await recordSentinelEvent({ event_type: "api_error", route: window.location.pathname, message, severity: response.status >= 500 ? "critical" : "warning", metadata: { status: response.status, url: String(url || "").slice(0, 300) } });
          await upsertIssueFromFailure({ route: window.location.pathname, message, network_errors: [{ status: response.status, url: String(url || "").slice(0, 300) }], issue_type: "api_error", severity: response.status >= 500 ? "critical" : "major", component_name: "fetch" });
        });
      }
    }
    return response;
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandled);
  document.addEventListener("click", onClick, true);
  document.addEventListener("submit", onSubmit, true);
  document.addEventListener("error", onMediaError, true);

  return () => {
    installed = false;
    console.error = originalConsoleError;
    window.fetch = originalFetch;
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandled);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("submit", onSubmit, true);
    document.removeEventListener("error", onMediaError, true);
  };
}