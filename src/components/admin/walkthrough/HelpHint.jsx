import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function HelpHint({ title, children }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Help: ${title}`}
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/20 text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          <HelpCircle className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-xs">
        <p className="mb-1 font-semibold text-foreground">{title}</p>
        <div className="leading-5 text-muted-foreground">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
