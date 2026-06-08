import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import FinalCtaMediaPanel from "./FinalCtaMediaPanel";

export default function HomeFinalCta({ config, section = {}, media }) {
  if (section.visible === false) return null;
  const finalConfig = {
    ...config,
    final_cta_title: section.title || config.final_cta_title,
    final_cta_body: section.description || config.final_cta_body,
    primary_cta_label: section.buttonLabel || config.primary_cta_label,
    primary_cta_path: section.buttonRoute || config.primary_cta_path,
  };

  if (media) return <section className="border-t border-border/30 px-4 py-24"><FinalCtaMediaPanel config={finalConfig} media={media} overlay={section.overlay} /></section>;
  return (
    <section className="border-t border-border/30 px-4 py-24">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-card/40 to-transparent p-8 text-center sm:p-12">
        <p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">Why It Matters</p>
        <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">{finalConfig.final_cta_title}</h2>
        <p className="mx-auto mt-4 max-w-xl font-body text-base font-light leading-relaxed text-muted-foreground">{finalConfig.final_cta_body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={finalConfig.primary_cta_path || "/onboarding"} className="w-full sm:w-auto">
            <Button className="min-h-11 w-full bg-primary text-primary-foreground sm:w-auto">
              {finalConfig.primary_cta_label} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/white-label" className="w-full sm:w-auto">
            <Button variant="outline" className="min-h-11 w-full border-border/60 sm:w-auto">Learn About the Platform</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}