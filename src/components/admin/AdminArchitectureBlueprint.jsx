import { useState } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import {
  Users, Shield, Database, Activity,
  Building2, Palette, Globe, Smartphone, Monitor,
  Image, Cpu, ArrowDown, Maximize2, X, Download
} from "lucide-react";
import { blueprintPageFunctions, blueprintFlatPages, blueprintValidationChecklist } from "@/components/admin/blueprintStructure";

const nodeBase = "rounded-lg border px-3 py-2 transition-all hover:-translate-y-0.5 hover:bg-white/[0.05]";

const accessChannels = [
  { label: "Master Admin", icon: Shield, path: "/admin/master" },
  { label: "Platform Admin", icon: Monitor, path: "/admin/platform" },
  { label: "Tenant Admin", icon: Users, path: "/admin/tenant/asian-operatic-museum" },
  { label: "Platform Public", icon: Globe, path: "/" },
  { label: "Tenant Public", icon: Smartphone, path: "/museum/asian-operatic-museum" },
];

const layerIcons = [Shield, Globe, Palette, Building2, Database, Cpu, Activity, Image];
const layerTones = [
  "border-cyan-400/25 bg-cyan-400/[0.04]",
  "border-emerald-400/25 bg-emerald-400/[0.04]",
  "border-violet-400/25 bg-violet-400/[0.04]",
  "border-blue-400/25 bg-blue-400/[0.04]",
  "border-amber-400/25 bg-amber-400/[0.04]",
  "border-teal-400/25 bg-teal-400/[0.04]",
  "border-fuchsia-400/25 bg-fuchsia-400/[0.04]",
  "border-primary/25 bg-primary/[0.04]",
];

const layers = blueprintPageFunctions.map((layer, index) => ({
  title: `${index + 1}. ${layer.title}`,
  tone: layerTones[index % layerTones.length],
  icon: layerIcons[index % layerIcons.length],
  nodes: layer.pages.slice(0, 8).map((page) => ({
    label: page.page,
    path: page.path.startsWith("/") ? page.path : "/admin/platform/architecture-blueprint",
    icon: layerIcons[index % layerIcons.length]
  }))
}));

export default function AdminArchitectureBlueprint() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownloadBlueprint = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 16;

    const addPageIfNeeded = (height = 12) => {
      if (y + height > pageHeight - 14) {
        doc.addPage();
        y = 16;
      }
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SCAVerse Canonical Architecture Blueprint", 14, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Master, platform, tenant, database, render, analytics, media, and customer-flow layers.", 14, y);
    y += 10;

    blueprintPageFunctions.forEach((layer) => {
      addPageIfNeeded(18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${layer.label}. ${layer.title}`, 14, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.splitTextToSize(layer.purpose, pageWidth - 28).forEach((line) => {
        addPageIfNeeded(4);
        doc.text(line, 14, y);
        y += 4;
      });
      y += 2;

      layer.pages.forEach((page) => {
        addPageIfNeeded(20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(`${page.code}  ${page.path} — ${page.page}`, 16, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.splitTextToSize(`Function: ${page.function}`, pageWidth - 32).forEach((line) => {
          addPageIfNeeded(4);
          doc.text(line, 18, y);
          y += 4;
        });
        doc.splitTextToSize(`Admin connection: ${page.adminConnection}`, pageWidth - 32).forEach((line) => {
          addPageIfNeeded(4);
          doc.text(line, 18, y);
          y += 4;
        });
        y += 2;
      });
      y += 2;
    });

    addPageIfNeeded(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Validation", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    blueprintValidationChecklist.forEach((item) => {
      doc.splitTextToSize(`- ${item}`, pageWidth - 28).forEach((line) => {
        addPageIfNeeded(4);
        doc.text(line, 14, y);
        y += 4;
      });
      y += 1;
    });

    doc.save("scaverse-canonical-architecture-blueprint.pdf");
  };

  return (
    <section className={isFullscreen ? "fixed inset-0 z-50 bg-[#060c18] overflow-auto p-4" : "rounded-2xl border border-primary/20 bg-card/30 overflow-hidden"}>
      <div className="border-b border-border/50 bg-gradient-to-r from-primary/10 via-cyan-400/5 to-fuchsia-400/10 px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-medium">Canonical SCAVerse Blueprint</p>
          <h2 className="text-lg font-display font-bold text-foreground mt-1">Multi-Tenant Mirrored-Content Architecture</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Master Admin → Platform Admin → Tenant Admin → Database → Render Engine → Tenant Public Museum → Customer Experience → Analytics Feedback Loop.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-primary hover:bg-primary/15 transition-colors flex-shrink-0"
        >
          {isFullscreen ? <X className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          {isFullscreen ? "Close" : "Full Screen"}
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-5 gap-2 mb-3">
            {accessChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <Link key={channel.path + channel.label} to={channel.path} className={`${nodeBase} border-cyan-400/20 bg-cyan-400/[0.03] text-center`}>
                  <Icon className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <span className="text-[10px] text-foreground/80">{channel.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex justify-center text-primary/60 mb-2">
            <ArrowDown className="w-4 h-4" />
          </div>

          <div className="space-y-3">
            {layers.map((layer, index) => {
              const LayerIcon = layer.icon;
              return (
                <div key={layer.title}>
                  <div className={`rounded-xl border ${layer.tone} p-3`}>
                    <div className="grid grid-cols-[170px_1fr] gap-3 items-stretch">
                      <div className="rounded-lg border border-white/10 bg-black/15 p-3 flex flex-col justify-center">
                        <LayerIcon className="w-4 h-4 text-primary mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">{String.fromCharCode(65 + index)}. {layer.title.replace(/^\d+\.\s*/, "")}</p>
                      </div>
                      <div className="grid grid-cols-3 xl:grid-cols-4 gap-2">
                        {layer.nodes.map((node, nodeIndex) => {
                          const Icon = node.icon;
                          const nodeCode = `${String.fromCharCode(65 + index)}${nodeIndex + 1}`;
                          return (
                            <Link key={node.path + node.label} to={node.path} className={`${nodeBase} border-white/10 bg-black/10 group`}>
                              <div className="flex items-center gap-2">
                                <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[8px] font-mono text-primary">{nodeCode}</span>
                                <Icon className="w-3.5 h-3.5 text-primary/80 flex-shrink-0" />
                                <span className="text-[10px] text-foreground/80 group-hover:text-foreground truncate">{node.label}</span>
                              </div>
                              <p className="text-[9px] text-muted-foreground mt-1 truncate">{node.path}</p>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {index < layers.length - 1 && (
                    <div className="flex justify-center text-primary/40 py-1">
                      <ArrowDown className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-foreground font-medium">Outcome: one canonical, non-destructive SCAVerse architecture map preserving all current platform, tenant, render, media, analytics, AI, VR, and gamification capabilities.</p>
            <span className="text-[10px] text-primary font-mono whitespace-nowrap">CANONICAL ROUTES · MIRROR MAP</span>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-medium">Final Implemented Blueprint Structure</p>
                <h3 className="mt-1 text-sm font-semibold text-foreground">Every canonical layer, route alias, mirror contract, and rendering dependency</h3>
              </div>
              <button
                type="button"
                onClick={handleDownloadBlueprint}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/15"
              >
                <Download className="h-3.5 w-3.5" /> Download Blueprint PDF
              </button>
            </div>

            <div className="space-y-3">
              {blueprintPageFunctions.map((layer) => (
                <div key={layer.label} className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
                  <div className="mb-2 flex items-start gap-2">
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-mono text-primary">{layer.label}</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{layer.title}</p>
                      <p className="text-[10px] text-muted-foreground">{layer.purpose}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {layer.pages.map((page) => (
                      <div key={page.code} className="rounded-md border border-white/6 bg-black/15 p-2">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="rounded border border-primary/25 px-1.5 py-0.5 text-[8px] font-mono text-primary">{page.code}</span>
                          <span className="text-[10px] font-semibold text-foreground truncate">{page.path}</span>
                        </div>
                        <p className="text-[9px] leading-4 text-foreground/75">{page.function}</p>
                        <p className="mt-1 text-[9px] leading-4 text-cyan-200/70">{page.adminConnection}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4">
              <p className="mb-2 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300">
                Blueprint badge: {blueprintFlatPages.length} routed page entries labelled from A at the top to H at the bottom
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {blueprintValidationChecklist.map((item) => (
                  <div key={item} className="rounded-lg border border-emerald-300/15 bg-black/15 px-3 py-2 text-[10px] leading-4 text-emerald-100/80">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}