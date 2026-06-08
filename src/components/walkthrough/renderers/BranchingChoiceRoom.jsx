import { Button } from "@/components/ui/button";

export default function BranchingChoiceRoom({ room, context = {} }) {
  const config = room.branching_choice_config || {};
  return <div className="flex min-h-[70vh] items-center justify-center px-4 py-20"><div className="max-w-3xl rounded-[2rem] border border-white/15 bg-background/80 p-8 text-center backdrop-blur-xl"><p className="text-xs uppercase tracking-[0.28em] text-primary">Branching Choice</p><h1 className="mt-3 font-display text-4xl font-bold">{room.title}</h1><p className="mt-4 text-sm leading-7 text-muted-foreground">{room.narration || room.description || config.prompt}</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{(config.choices || []).map((choice) => <Button key={choice.id || choice.label} variant="outline" onClick={() => context.goToRoom?.(choice.next_room_id, { choice_id: choice.id, choice_label: choice.label })}>{choice.label}</Button>)}</div></div></div>;
}