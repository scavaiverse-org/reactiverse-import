import { useEffect, useRef, useState } from "react";
import WalkthroughFallbackVisual from "@/components/walkthrough/WalkthroughFallbackVisual";
import { getSafeMediaUrl } from "@/lib/walkthrough-media-url";

export default function ScrollableImageLayer({ url, alt = "Scrollable image", settings = {}, className = "h-full w-full", imageClassName = "", children = null }) {
  const safeUrl = getSafeMediaUrl(url);
  const viewportRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const [metrics, setMetrics] = useState({ viewportRatio: 1, imageRatio: 1, loaded: false });
  const [failed, setFailed] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0.5);
  const [interacted, setInteracted] = useState(false);
  const sensitivity = Number(settings.scrollable_image_drag_sensitivity || 1);
  // The image is a real wide panorama; it is scrollable whenever it is wider than the viewport.
  const canDrag = metrics.loaded && metrics.imageRatio > metrics.viewportRatio * 1.02;

  useEffect(() => {
    setFailed(false);
    setMetrics((current) => ({ ...current, loaded: false }));
  }, [safeUrl]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const update = () => {
      const image = imageRef.current;
      const rect = viewport.getBoundingClientRect();
      setMetrics((current) => ({
        ...current,
        viewportRatio: rect.width && rect.height ? rect.width / rect.height : current.viewportRatio,
        imageRatio: image?.naturalWidth && image?.naturalHeight ? image.naturalWidth / image.naturalHeight : current.imageRatio,
      }));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [safeUrl]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !canDrag) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    const initial = settings.scrollable_image_initial_position || "center";
    viewport.scrollLeft = initial === "left" ? 0 : initial === "right" ? max : max / 2;
    setScrollProgress(initial === "left" ? 0 : initial === "right" ? 1 : 0.5);
  }, [canDrag, settings.scrollable_image_initial_position, safeUrl]);

  const trackProgress = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    setScrollProgress(max > 0 ? viewport.scrollLeft / max : 0.5);
  };

  const markInteraction = () => { if (!interacted) setInteracted(true); };

  const onPointerDown = (event) => {
    if (!canDrag || settings.scrollable_image_mouse_drag === false) return;
    dragRef.current = { active: true, startX: event.clientX, scrollLeft: viewportRef.current?.scrollLeft || 0 };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!dragRef.current.active || !viewportRef.current) return;
    viewportRef.current.scrollLeft = dragRef.current.scrollLeft - ((event.clientX - dragRef.current.startX) * sensitivity);
    markInteraction();
    trackProgress();
  };

  const stopDrag = () => { dragRef.current.active = false; };

  const onKeyDown = (event) => {
    if (!canDrag || !viewportRef.current) return;
    if (event.key === "ArrowLeft") { viewportRef.current.scrollBy({ left: -80 * sensitivity, behavior: "smooth" }); markInteraction(); }
    if (event.key === "ArrowRight") { viewportRef.current.scrollBy({ left: 80 * sensitivity, behavior: "smooth" }); markInteraction(); }
  };

  if (!safeUrl || failed) return <WalkthroughFallbackVisual title="Media not available yet" description="This media asset is not available yet." compact={false} className={className} />;

  // Subtle cinematic "turning" feel based on how far the visitor has scrolled.
  const turnOffset = (scrollProgress - 0.5) * 12;
  const showHint = canDrag && !interacted;
  const isTouch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <img src={safeUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl" draggable="false" />
      <div
        ref={viewportRef}
        tabIndex={canDrag ? 0 : -1}
        role="img"
        aria-label={canDrag ? `${alt}. Drag or swipe left and right to explore.` : alt}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onPointerLeave={stopDrag}
        onScroll={() => { markInteraction(); trackProgress(); }}
        onKeyDown={onKeyDown}
        className={`relative z-10 flex h-full w-full overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-scrollbar]:hidden ${canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
        style={{ scrollbarWidth: "none", touchAction: canDrag && settings.scrollable_image_mobile_swipe !== false ? "pan-x" : "auto" }}
      >
        <div className="relative z-10 h-full" style={{ transform: `perspective(1200px) rotateY(${turnOffset * -0.12}deg)`, transformOrigin: "center", transition: dragRef.current.active ? "none" : "transform 200ms ease-out" }}>
          <img
            ref={imageRef}
            src={safeUrl}
            alt={alt}
            draggable="false"
            onLoad={() => {
              const image = imageRef.current;
              if (image?.naturalWidth && image?.naturalHeight) setMetrics((current) => ({ ...current, imageRatio: image.naturalWidth / image.naturalHeight, loaded: true }));
            }}
            onError={() => setFailed(true)}
            className={`relative z-10 h-full select-none object-cover ${imageClassName}`}
            style={{ width: "auto", maxWidth: "none", minWidth: "100%" }}
          />
          {children && <div className="pointer-events-none absolute inset-0 z-20">{children}</div>}
        </div>
      </div>

      {/* subtle edge darkening / lighting shift driven by scroll progress */}
      {canDrag && settings.scrollable_image_edge_protection !== false && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 bg-gradient-to-r from-black/45 to-transparent" style={{ opacity: 0.6 + (0.5 - scrollProgress) * 0.6 }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 bg-gradient-to-l from-black/45 to-transparent" style={{ opacity: 0.6 + (scrollProgress - 0.5) * 0.6 }} />
        </>
      )}

      {showHint && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 animate-pulse rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
          {isTouch ? "Swipe left or right to explore" : "Drag left or right to explore"}
        </div>
      )}
    </div>
  );
}