import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";
import ScrollableImageLayer from "@/components/walkthrough/ScrollableImageLayer";
import WalkthroughFallbackVisual from "@/components/walkthrough/WalkthroughFallbackVisual";
import { getScrollableImageSettings } from "@/lib/scrollable-image";

export default function TimelineRoom({ room }) {
  const config = room.timeline_config || {};
  return (
    <div className="mx-auto max-w-5xl px-4 py-24">
      <p className="text-xs uppercase tracking-[0.28em] text-primary">Timeline Room</p>
      <h1 className="mt-3 font-display text-5xl font-bold">{room.title || config.timeline_title}</h1>
      <div className="mt-8 space-y-4">
        {(config.events || []).map((event, index) => {
          const scrollable = getScrollableImageSettings(event, event.media_type);
          return (
            <div key={event.id || index} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-xs uppercase tracking-widest text-primary">{event.date || event.year || `Milestone ${index + 1}`}</p>
              <h2 className="mt-2 font-display text-2xl font-bold">{event.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{event.description}</p>
              {event.media_url ? (scrollable ? <div className="mt-4 h-48 w-full overflow-hidden rounded-2xl"><ScrollableImageLayer url={event.media_url} alt={event.title} settings={scrollable} /></div> : <ResolvedMedia url={event.media_url} mediaType={event.media_type} alt={event.title} className="mt-4 h-48 w-full rounded-2xl object-cover" controls fallbackVisual fallbackCompact />) : <WalkthroughFallbackVisual compact className="mt-4 h-48 w-full rounded-2xl" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}