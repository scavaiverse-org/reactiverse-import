import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function MemoryCollectionRoom({ room, context = {} }) {
  const config = room.memory_collection_config || {};
  const [note, setNote] = useState("");
  return <div className="mx-auto max-w-4xl px-4 py-24"><div className="rounded-[2rem] border border-white/15 bg-background/80 p-8 backdrop-blur-xl"><p className="text-xs uppercase tracking-[0.28em] text-primary">Memory Collection</p><h1 className="mt-3 font-display text-4xl font-bold">{room.title || config.collection_title}</h1><p className="mt-4 text-sm text-muted-foreground">{room.narration || room.description || config.prompt}</p><div className="mt-6 grid gap-3 md:grid-cols-3">{(config.collectibles || []).map((item) => <div key={item.id || item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-semibold">{item.title}</h2><p className="mt-2 text-xs text-muted-foreground">{item.description}</p></div>)}</div>{config.allow_journal !== false && <Textarea className="mt-6" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Save a memory..." />}<Button className="mt-4" onClick={() => context.track?.("walkthrough_memory_saved", { has_note: !!note })}>Save Memory</Button></div></div>;
}