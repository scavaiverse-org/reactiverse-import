import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const newCollectible = () => ({ id: crypto.randomUUID(), title: "Memory", description: "" });
export default function MemoryCollectionRoomEditor({ room, onChange }) {
  const config = room.memory_collection_config || {};
  const collectibles = config.collectibles || [];
  const setConfig = (patch) => onChange({ ...room, memory_collection_config: { ...config, ...patch } });
  return <section className="space-y-4 rounded-2xl border border-primary/15 bg-primary/5 p-4"><h3 className="text-sm font-semibold text-primary">Memory Collection Room fields</h3><label className="space-y-2"><Label>Collection title</Label><Input value={config.collection_title || ""} onChange={(e) => setConfig({ collection_title: e.target.value })} /></label><label className="space-y-2"><Label>Prompt</Label><Textarea value={config.prompt || ""} onChange={(e) => setConfig({ prompt: e.target.value })} /></label><div className="flex items-center justify-between"><p className="text-xs uppercase tracking-widest text-muted-foreground">Collectibles</p><Button size="sm" variant="outline" onClick={() => setConfig({ collectibles: [...collectibles, newCollectible()] })}>Add memory</Button></div>{collectibles.map((item, index) => <div key={item.id || index} className="grid gap-2 rounded-xl border border-white/10 bg-background/40 p-3 md:grid-cols-3"><Input value={item.title || ""} placeholder="Title" onChange={(e) => setConfig({ collectibles: collectibles.map((entry, i) => i === index ? { ...item, title: e.target.value } : entry) })} /><Input className="md:col-span-2" value={item.description || ""} placeholder="Description" onChange={(e) => setConfig({ collectibles: collectibles.map((entry, i) => i === index ? { ...item, description: e.target.value } : entry) })} /></div>)}</section>;
}