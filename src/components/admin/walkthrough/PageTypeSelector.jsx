import { PAGE_TYPE_OPTIONS } from "@/lib/walkthrough-room-types";
import { Label } from "@/components/ui/label";

export default function PageTypeSelector({ value, onChange }) {
  return (
    <label className="space-y-2">
      <Label>Master Page Type</Label>
      <select
        value={value || "walkthrough_exhibition"}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-56 rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {PAGE_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}