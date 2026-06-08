import { useQuery } from "@tanstack/react-query";
import { Music, PlayCircle, Repeat, Rocket } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ONBOARDING_TARGET_KEY = "home_onboarding_intro";

export default function OnboardingSong() {
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["onboarding-song-assets"],
    queryFn: () => base44.entities.MusicAsset.filter({ targetKey: ONBOARDING_TARGET_KEY }, "-updatedAt", 10),
    initialData: [],
  });

  const activeAsset = assets.find((asset) => asset.enabled !== false && asset.status === "active") || assets[0];

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Music className="h-3.5 w-3.5" /> Master Admin
          </div>
          <h1 className="font-display text-4xl font-bold">onboardingsong</h1>
          <p className="mt-2 text-sm text-muted-foreground">This tab controls the soundtrack linked to the homepage onboarding overlay.</p>
        </div>

        <Card className="border-white/10 bg-card/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" /> Active Onboarding Music
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading onboarding song...</p>
            ) : activeAsset ? (
              <>
                <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <h2 className="text-2xl font-semibold">{activeAsset.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{activeAsset.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge>{activeAsset.status}</Badge>
                      <Badge variant="secondary">Autoplay {activeAsset.autoplay !== false ? "on" : "off"}</Badge>
                      <Badge variant="secondary" className="gap-1"><Repeat className="h-3 w-3" /> Loop {activeAsset.loop !== false ? "on" : "off"}</Badge>
                      <Badge variant="outline">Volume {Math.round(Number(activeAsset.volume ?? 0.7) * 100)}%</Badge>
                    </div>
                  </div>
                  <div className="rounded-full border border-primary/25 bg-primary/10 p-5 text-primary">
                    <PlayCircle className="h-10 w-10" />
                  </div>
                </div>

                <audio controls loop className="w-full" src={activeAsset.fileUrl}>
                  Your browser does not support audio playback.
                </audio>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                  Linked target: <span className="font-semibold text-foreground">Homepage First-Time Onboarding</span>. This file will play automatically when onboarding opens and will loop continuously.
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No onboarding song is connected yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}