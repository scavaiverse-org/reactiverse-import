import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, RotateCw, Volume2 } from "lucide-react";
import DeveloperPanel from "@/components/test-room/DeveloperPanel";
import DestinationModal from "@/components/test-room/DestinationModal";

const TestRoomWorld = lazy(() => import("@/components/test-room/TestRoomWorld"));

const defaultTelemetry = {
  fps: 60,
  destination: null,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
};

export default function TestRoom() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [entered, setEntered] = useState(false);
  const [telemetry, setTelemetry] = useState(defaultTelemetry);
  const [destination, setDestination] = useState(null);
  const [settings, setSettings] = useState({ particles: true, fog: true, hologram: true, autoRotate: false, music: false });
  const audioRef = useRef(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then((authenticated) => {
      if (!authenticated) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }
      setIsAllowed(true);
      setIsCheckingAuth(false);
    });
  }, []);

  const startMusic = useCallback(() => {
    if (audioRef.current) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.value = 0.035;
    gain.connect(context.destination);

    [110, 164.81, 220].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      filter.type = "lowpass";
      filter.frequency.value = 420;
      oscillator.connect(filter);
      filter.connect(gain);
      oscillator.start();
    });
    audioRef.current = context;
  }, []);

  const stopMusic = useCallback(() => {
    audioRef.current?.close();
    audioRef.current = null;
  }, []);

  const toggleSetting = useCallback((key) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === "music") {
        if (next.music) startMusic();
        else stopMusic();
      }
      return next;
    });
  }, [startMusic, stopMusic]);

  const enterWorld = () => {
    setEntered(true);
    setSettings((prev) => ({ ...prev, music: true }));
    startMusic();
  };

  const controlHint = useMemo(() => "Drag or swipe to turn left and right. Click a museum object to focus.", []);

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking access...
      </main>
    );
  }

  if (!isAllowed) return null;

  return (
    <main className="relative h-screen w-screen overflow-hidden text-white" style={{ backgroundImage: 'url(https://media.base44.com/images/public/6a171d7f6abbd230a00539e2/7c0e31b7e_Screenshot_2026-05-31-04-05-37-967_comgoogleandroidappsdocs-edit.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <div className="absolute inset-0 hidden sm:block">
        <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center bg-black/40"><Loader2 className="h-8 w-8 animate-spin text-cyan-200" /></div>}>
          <TestRoomWorld settings={settings} onTelemetry={setTelemetry} onDestination={setDestination} />
        </Suspense>
      </div>

      <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-cyan-200" /></div>}>
        <div className="sm:hidden">
          <TestRoomWorld settings={settings} onTelemetry={setTelemetry} onDestination={setDestination} />
        </div>
      </Suspense>

      <div className={`pointer-events-none absolute inset-0 z-10 bg-black transition-opacity duration-[2200ms] ${entered ? "opacity-0" : "opacity-100"}`} />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.16),transparent_38%),linear-gradient(to_bottom,rgba(2,6,23,0.1),rgba(2,6,23,0.72))]" />

      {!entered && (
        <section className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center">
          <div className="max-w-2xl rounded-[2rem] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Isolated Sandbox</p>
            <h1 className="mb-4 font-display text-4xl font-bold sm:text-6xl">Test Room</h1>
            <p className="mx-auto mb-6 max-w-xl text-sm leading-7 text-white/65">
            Enter a cinematic Asian Operatic Museum entrance for testing premium 3D camera rotation, hologram focus, exhibit hotspots, and masterclass interactions.
            </p>
            <Button onClick={enterWorld} className="bg-cyan-200 px-8 text-slate-950 hover:bg-cyan-100">
              <Volume2 className="h-4 w-4" /> Enter Living World
            </Button>
          </div>
        </section>
      )}

      <header className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-start justify-between p-4 sm:p-6">
        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100/75">Interactive 3D Museum Masterclass</p>
          <h1 className="font-display text-xl font-bold">Test Room</h1>
          <p className="mt-1 max-w-xs text-xs text-white/55">{controlHint}</p>
        </div>
      </header>

      <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-white/55 backdrop-blur-xl sm:block">
        Entrance / Left Wing / Right Wing / Portal · Drag or swipe to turn left and right
      </div>

      <div className="pointer-events-auto absolute bottom-4 right-4 z-30 flex gap-2">
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("test-room-rotate", { detail: { direction: -1 } }))} className="rounded-full border border-white/10 bg-black/35 p-3 text-white/70 backdrop-blur-xl hover:text-white" aria-label="Rotate left">
          <RotateCcw className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("test-room-center"))} className="rounded-full border border-white/10 bg-black/35 px-4 py-3 text-xs text-white/70 backdrop-blur-xl hover:text-white" aria-label="Return to center">
          Center
        </button>
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("test-room-rotate", { detail: { direction: 1 } }))} className="rounded-full border border-white/10 bg-black/35 p-3 text-white/70 backdrop-blur-xl hover:text-white" aria-label="Rotate right">
          <RotateCw className="h-5 w-5" />
        </button>
      </div>

      <DeveloperPanel telemetry={telemetry} settings={settings} onToggle={toggleSetting} />
      <DestinationModal destination={destination} onClose={() => setDestination(null)} />
    </main>
  );
}