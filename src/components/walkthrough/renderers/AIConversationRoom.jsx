import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AIConversationRoom({ room, context = {} }) {
  const config = room.ai_conversation_config || {};
  const [messages, setMessages] = useState([{ role: "assistant", content: `I am ${config.persona_name || "ARIA"}. Ask me about this room.` }]);
  const [input, setInput] = useState("");
  const send = (text = input) => { if (!text.trim()) return; context.track?.("walkthrough_ai_question_started", { question: text }); setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "This room invites close looking, context, and reflection. Use the artifact notes and narration to guide your interpretation." }]); setInput(""); };
  return <div className="mx-auto max-w-4xl px-4 py-24"><div className="rounded-[2rem] border border-white/15 bg-background/80 p-6 backdrop-blur-xl"><div className="mb-5 flex items-center gap-3"><Bot className="h-6 w-6 text-primary" /><div><p className="text-xs uppercase tracking-[0.28em] text-primary">AI Conversation Room</p><h1 className="font-display text-3xl font-bold">{room.title || config.persona_name || "ARIA"}</h1></div></div><div className="space-y-3">{messages.map((message, index) => <div key={index} className={`rounded-2xl p-3 text-sm ${message.role === "user" ? "ml-auto max-w-[80%] bg-primary text-primary-foreground" : "mr-auto max-w-[80%] bg-white/10"}`}>{message.content}</div>)}</div><div className="mt-5 flex gap-2"><Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about this room..." onKeyDown={(e) => e.key === "Enter" && send()} /><Button onClick={() => send()}><Send className="h-4 w-4" /></Button></div><div className="mt-4 flex flex-wrap gap-2">{(config.starter_questions || []).map((question) => <Button key={question} size="sm" variant="outline" onClick={() => send(question)}>{question}</Button>)}</div></div></div>;
}