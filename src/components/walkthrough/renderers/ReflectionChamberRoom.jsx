import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ReflectionChamberRoom({ room, context = {} }) {
  const config = room.reflection_config || {};
  const [mood, setMood] = useState("");
  const [journal, setJournal] = useState("");
  return <div className="flex min-h-[70vh] items-center justify-center px-4 py-20"><div className="max-w-2xl rounded-[2rem] border border-white/15 bg-background/80 p-8 text-center backdrop-blur-xl"><p className="text-xs uppercase tracking-[0.28em] text-primary">Reflection Chamber</p><h1 className="mt-3 font-display text-4xl font-bold">{room.title}</h1><p className="mt-4 text-sm leading-7 text-muted-foreground">{room.narration || room.description || config.reflection_prompt}</p><div className="mt-6 flex flex-wrap justify-center gap-2">{(config.mood_options || []).map((item) => <Button key={item} variant={mood === item ? "default" : "outline"} onClick={() => setMood(item)}>{item}</Button>)}</div><Textarea className="mt-5" value={journal} onChange={(e) => setJournal(e.target.value)} placeholder={config.journal_placeholder || "Write your reflection..."} /><Button className="mt-5" onClick={() => context.track?.("walkthrough_reflection_completed", { mood, has_journal: !!journal })}>{config.completion_message || "Save Reflection"}</Button></div></div>;
}