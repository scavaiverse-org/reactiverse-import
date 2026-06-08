import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PlatformActionCard({ icon: Icon, title, subtitle, cta, path }) {
  return (
    <Card className="group h-full border-border/50 bg-card/70 transition hover:border-primary/35 hover:bg-card">
      <CardContent className="flex h-full flex-col p-6">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
        <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{subtitle}</p>
        <Link to={path} className="mt-6">
          <Button className="w-full bg-primary text-primary-foreground">
            {cta} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}