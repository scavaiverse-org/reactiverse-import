import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";

export default function DestinationModal({ destination, onClose }) {
  if (!destination) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/20 px-4 pb-8 backdrop-blur-[2px] sm:items-center sm:pb-0">
      <div className="w-full max-w-md rounded-3xl border border-amber-200/20 bg-[#100b08]/90 p-6 text-white shadow-[0_0_80px_rgba(245,158,11,0.18)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200/70">Masterclass Hotspot</p>
            <h2 className="font-display text-2xl font-bold text-amber-50">{destination.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 p-2 text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm leading-6 text-white/65">{destination.description}</p>
        <Button onClick={() => alert(`${destination.name} placeholder`)} className="mt-5 w-full bg-amber-200 text-slate-950 hover:bg-amber-100">
          Enter Module <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}