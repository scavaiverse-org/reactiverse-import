import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AIConversationRoomEditor({ room, onChange }) {
  const config = room.ai_conversation_config || {};
  const setConfig = (patch) => onChange({ ...room, ai_conversation_config: { ...config, ...patch } });
  return <section className="grid gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 md:grid-cols-2"><h3 className="md:col-span-2 text-sm font-semibold text-primary">AI Conversation Room fields</h3><label className="space-y-2"><Label>Persona name</Label><Input value={config.persona_name || ""} onChange={(e) => setConfig({ persona_name: e.target.value })} /></label><label className="space-y-2"><Label>Suggested next room</Label><Input value={config.suggested_next_room_id || ""} onChange={(e) => setConfig({ suggested_next_room_id: e.target.value })} /></label><label className="space-y-2 md:col-span-2"><Label>System context</Label><Textarea rows={3} value={config.system_context || ""} onChange={(e) => setConfig({ system_context: e.target.value })} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.artifact_context_enabled !== false} onChange={(e) => setConfig({ artifact_context_enabled: e.target.checked })} /> Artifact-aware discussion</label></section>;
}