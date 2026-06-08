import { useEffect, useRef, useState } from "react";

// Admin/debug preview of raw generated panels only. Public visitor rendering must use ScrollableImageLayer with scrollable_image_extended_url when a stitched panorama exists.
export default function ThreePanelScrollableImageLayer({ originalUrl, leftExtensionUrl, rightExtensionUrl, alt = "Scrollable museum room", settings = {}, className = "h-full w-full", children = null }) {
  const viewportRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const [interacted, setInteracted] = useState(false);
  const sensitivity = Number(settings.scrollable_image_drag_sensitivity || 1);
  const panels = [leftExtensionUrl || originalUrl, originalUrl, rightExtensionUrl || originalUrl].filter(Boolean);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    viewport.scrollLeft = max / 2;
  }, [originalUrl, leftExtensionUrl, rightExtensionUrl]);

  if (!originalUrl) return null;

  const onPointerDown = (event) => {
    dragRef.current = { active: true, startX: event.clientX, scrollLeft: viewportRef.current?.scrollLeft || 0 };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!dragRef.current.active || !viewportRef.current) return;
    viewportRef.current.scrollLeft = dragRef.current.scrollLeft - ((event.clientX - dragRef.current.startX) * sensitivity);
    setInteracted(true);
  };
  const stopDrag = () => { dragRef.current.active = false; };

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <img src={originalUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl" draggable="false" />
      <div
        ref={viewportRef}
        role="img"
        aria-label={`${alt}. Drag or swipe left and right to explore.`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onPointerLeave={stopDrag}
        onScroll={() => setInteracted(true)}
        className="relative z-10 flex h-full w-full cursor-grab overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", touchAction: settings.scrollable_image_mobile_swipe === false ? "auto" : "pan-x" }}
      >
        <div className="relative flex h-full min-w-[300%]">
          {panels.map((url, index) => (
            <img key={`${url}-${index}`} src={url} alt={index === 1 ? alt : ""} aria-hidden={index !== 1} draggable="false" className={`h-full w-1/3 select-none object-cover ${index !== 1 && !url ? "blur-sm" : ""}`} />
          ))}
          {children && <div className="pointer-events-none absolute inset-0 z-20">{children}</div>}
        </div>
      </div>
      {!interacted && <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 animate-pulse rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">Drag or swipe left and right to explore</div>}
    </div>
  );
}