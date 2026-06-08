import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";
import ScrollableImageLayer from "@/components/walkthrough/ScrollableImageLayer";
import WalkthroughFallbackVisual from "@/components/walkthrough/WalkthroughFallbackVisual";
import { getScrollableImageSettings } from "@/lib/scrollable-image";

export default function ArchiveRoom({ room }) {
  const config = room.archive_config || {};
  const [query, setQuery] = useState("");
  const documents = useMemo(() => (config.documents || []).filter((doc) => `${doc.title} ${doc.description} ${doc.category}`.toLowerCase().includes(query.toLowerCase())), [config.documents, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-24">
      <p className="text-xs uppercase tracking-[0.28em] text-primary">Archive Room</p>
      <h1 className="mt-3 font-display text-5xl font-bold">{room.title || config.archive_title}</h1>
      {config.searchable !== false && <Input className="mt-6 max-w-md" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search archive..." />}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {documents.map((doc, index) => {
          const url = doc.file_url || doc.media_url;
          const scrollable = getScrollableImageSettings(doc, doc.media_type || doc.category);
          return (
            <div key={doc.id || index} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 hover:border-primary/40">
              {url ? (scrollable ? <div className="mb-4 h-36 w-full overflow-hidden rounded-2xl"><ScrollableImageLayer url={url} alt={doc.title} settings={scrollable} /></div> : <ResolvedMedia url={url} mediaType={doc.media_type || doc.category} alt={doc.title} className="mb-4 h-36 w-full rounded-2xl object-cover" controls fallbackVisual fallbackCompact />) : <WalkthroughFallbackVisual compact className="mb-4 h-36 w-full rounded-2xl" />}
              <p className="text-xs text-primary">{doc.category || doc.media_type || "document"}</p>
              <h2 className="mt-2 font-display text-xl font-bold">{doc.title}</h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{doc.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}