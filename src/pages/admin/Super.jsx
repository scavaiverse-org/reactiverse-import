import { Bot, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUPERAGENT_URL = "https://app.base44.com/superagent/6a2544656783af4b6e8309c9";

export default function Super() {
  return (
    <div className="min-h-screen bg-[#060c18] p-4 text-foreground sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Super
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Superagent Console</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Speak with your Superagent from the master admin panel. This page is protected by the platform admin access gate.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" /> Admin-visible page
              </div>
              <p className="mt-2 text-xs text-emerald-100/70">Only authorized platform admins can open this master admin tab.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">Superagent</h2>
                <p className="text-xs text-muted-foreground">ID: 6a2544656783af4b6e8309c9</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              Use this embedded console to talk to Superagent, or open it directly in a new tab if your browser blocks embedded pages.
            </p>
            <Button asChild className="mt-5 w-full bg-primary text-primary-foreground">
              <a href={SUPERAGENT_URL} target="_blank" rel="noreferrer">
                Open Superagent <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </aside>

          <section className="min-h-[70vh] overflow-hidden rounded-3xl border border-white/10 bg-[#f6f3ee] shadow-2xl">
            <iframe
              title="Superagent"
              src={SUPERAGENT_URL}
              className="h-[70vh] w-full border-0"
              allow="clipboard-read; clipboard-write; microphone; camera"
            />
          </section>
        </div>
      </div>
    </div>
  );
}