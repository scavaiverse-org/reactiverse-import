import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── simple‑English helpers ────────────────────────────────────────────────

function severityLabel(sev) {
  if (sev === "critical") return "🔴 Very Serious";
  if (sev === "major") return "🟠 Serious";
  if (sev === "minor") return "🟡 Small";
  if (sev === "warning") return "⚠️ Warning";
  return sev || "Unknown";
}

function shorten(text = "", max = 180) {
  text = text.trim();
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

function findIssueByKeyword(msg, issues) {
  const stopWords = new Set(["how", "what", "fix", "is", "the", "a", "an", "to", "i", "do", "mean", "explain", "about", "tell", "me", "this", "that", "show", "give", "get", "please", "help"]);
  const words = msg.toLowerCase().replace(/[?!.,]/g, "").split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
  if (!words.length) return null;
  return issues.find(issue => {
    const hay = ((issue.title || "") + " " + (issue.description || "") + " " + (issue.route || "")).toLowerCase();
    return words.some(w => hay.includes(w));
  }) || null;
}

function generateReply(userMsg, issues) {
  const msg = userMsg.toLowerCase().replace(/[?!.,]/g, "").trim();
  const open = issues.filter(i => !["fixed", "ignored"].includes(i.status));
  const critical = open.filter(i => i.severity === "critical");
  const major = open.filter(i => i.severity === "major");
  const minor = open.filter(i => i.severity === "minor");

  // greeting
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))/.test(msg)) {
    return [
      `Hello! 👋 I am your QA helper.`,
      `Right now there are **${open.length} open problems** on the platform.`,
      `${critical.length > 0 ? `⚠️ **${critical.length}** of them are very serious.` : "✅ No very serious problems at the moment."}`,
      `\nYou can ask me things like:\n• "What is broken?"\n• "Show me the serious problems"\n• "How do I fix [problem name]?"\n• "What does [problem name] mean?"\n• "How many bugs are there?"`,
    ].join("\n");
  }

  // count / how many
  if (/how many|count|total|number of/.test(msg)) {
    return [
      `Here is the count right now:\n`,
      `🔴 **Very serious (critical):** ${critical.length}`,
      `🟠 **Serious (major):** ${major.length}`,
      `🟡 **Small (minor):** ${minor.length}`,
      `\n**Total open problems: ${open.length}**`,
      `\n${critical.length > 0 ? "Fix the very serious ones first — they block users the most." : "No very serious problems — that is good!"}`,
    ].join("\n");
  }

  // what is broken / show all bugs / list
  if (/what is broken|what.{0,10}wrong|show.{0,10}(all|bug|problem|issue)|list|all bug|all problem/.test(msg)) {
    if (open.length === 0) return "✅ Great news! There are no open problems right now. Everything looks good.";
    const top = open.slice(0, 6);
    const lines = top.map((i, n) => `${n + 1}. **${i.title}** — ${severityLabel(i.severity)} — Page: \`${i.route || "unknown"}\``).join("\n");
    return `Here are the open problems (showing ${top.length} of ${open.length}):\n\n${lines}${open.length > 6 ? `\n\n...and ${open.length - 6} more. Ask me about a specific one to learn more.` : ""}`;
  }

  // critical / serious / worst / urgent
  if (/critical|serious|worst|urgent|emergency|very bad|most important/.test(msg)) {
    if (critical.length === 0) return "✅ Good news! There are no very serious problems right now.";
    const lines = critical.slice(0, 5).map((i, n) => [
      `${n + 1}. **${i.title}**`,
      `   Page: \`${i.route || "unknown"}\``,
      i.description ? `   What it means: ${shorten(i.description, 120)}` : "",
    ].filter(Boolean).join("\n")).join("\n\n");
    return `There are **${critical.length} very serious problems**. Fix these first:\n\n${lines}`;
  }

  // how to fix
  if (/how.{0,15}fix|what.{0,15}do.{0,15}(about|for)|solve|repair|fix step|step/.test(msg)) {
    const found = findIssueByKeyword(msg, issues);
    if (found) {
      const steps = found.recommended_fix_steps || [];
      const stepsText = steps.length
        ? steps.map((s, i) => `${i + 1}. ${s}`).join("\n")
        : "No fix steps saved yet. Try running the QA scan again to generate them.";
      return [
        `Here is how to fix: **${found.title}**\n`,
        `**What is the problem?**`,
        shorten(found.root_cause_hypothesis || found.description || "We do not know the exact cause yet. Run the QA scan to get more details.", 200),
        `\n**Steps to fix:**\n${stepsText}`,
        `\nAfter you fix it, run the QA test again to check it is working. ✅`,
      ].join("\n");
    }
    return `I need to know which problem you want to fix.\n\nTell me the name of the problem — for example: "How do I fix broken tickets page?"\n\nOr ask **"What is broken?"** to see the full list.`;
  }

  // what does X mean / explain X
  if (/what.{0,20}(mean|is)|explain|tell me about|describe/.test(msg)) {
    const found = findIssueByKeyword(msg, issues);
    if (found) {
      return [
        `**${found.title}**\n`,
        `**How serious is it?** ${severityLabel(found.severity)}`,
        `**Which page?** \`${found.route || "unknown"}\``,
        `\n**What it means in simple words:**`,
        shorten(found.description || "No description saved.", 200),
        found.root_cause_hypothesis ? `\n**Why did it happen?**\n${shorten(found.root_cause_hypothesis, 180)}` : "",
        found.fix_summary ? `\n**What to do:** ${shorten(found.fix_summary, 150)}` : "",
      ].filter(Boolean).join("\n");
    }
    // explain severity words
    if (/critical/.test(msg)) return "**Critical** means very serious.\n\nIt stops people from using the platform. Fix it right away — it is the most important.";
    if (/major/.test(msg)) return "**Major** means serious.\n\nIt breaks an important feature. Users can still use other parts of the platform, but fix it soon.";
    if (/minor/.test(msg)) return "**Minor** means small.\n\nIt is a small problem. Most users will not notice it. Fix it when you have time.";
    if (/warning/.test(msg)) return "**Warning** means possible future problem.\n\nNothing is broken yet, but something could break if you ignore it.";
    return `I could not find a problem with that name.\n\nAsk **"What is broken?"** to see the full list, then ask me about a specific one.`;
  }

  // route / page / link / 404
  if (/route|page|link|navigation|404|not found|broken link/.test(msg)) {
    const routeIssues = open.filter(i => (i.estimated_fix_area || "").includes("routing") || (i.area || "").includes("routing"));
    if (routeIssues.length === 0) return "✅ Good news! There are no broken page or link problems right now.";
    const lines = routeIssues.slice(0, 5).map((i, n) => `${n + 1}. **${i.title}** — Page: \`${i.route || "unknown"}\``).join("\n");
    return `There are **${routeIssues.length} page or link problems**:\n\n${lines}\n\nThis means some links or pages may not be working. Ask me about one to get fix steps.`;
  }

  // media / image / video / upload
  if (/media|image|video|photo|upload|picture/.test(msg)) {
    const mediaIssues = open.filter(i => (i.estimated_fix_area || "").includes("media") || (i.area || "").includes("media"));
    if (mediaIssues.length === 0) return "✅ Good news! There are no image or video problems right now.";
    const lines = mediaIssues.slice(0, 5).map((i, n) => `${n + 1}. **${i.title}** — Page: \`${i.route || "unknown"}\``).join("\n");
    return `There are **${mediaIssues.length} image or video problems**:\n\n${lines}\n\nThis means some images or videos may not be showing correctly.`;
  }

  // save / data / not saving
  if (/save|saving|not saved|data|persist/.test(msg)) {
    const saveIssues = open.filter(i => (i.estimated_fix_area || "").includes("data") || (i.area || "").includes("save"));
    if (saveIssues.length === 0) return "✅ Good news! There are no save or data problems right now.";
    const lines = saveIssues.slice(0, 5).map((i, n) => `${n + 1}. **${i.title}** — Page: \`${i.route || "unknown"}\``).join("\n");
    return `There are **${saveIssues.length} save or data problems**:\n\n${lines}\n\nThis means some things you type or save may not be stored correctly.`;
  }

  // fixed / done / resolved / closed
  if (/fixed|resolved|done|closed|solved/.test(msg)) {
    const fixed = issues.filter(i => ["fixed", "ignored"].includes(i.status));
    return fixed.length === 0
      ? "No problems have been marked as fixed yet."
      : `**${fixed.length} problems** have been marked as fixed or ignored.\n\nAsk me **"What is broken?"** to see only the open ones.`;
  }

  // help
  if (/help|what can you do|commands|options/.test(msg)) {
    return [
      "Here is what you can ask me:\n",
      '• **"What is broken?"** — see all open problems',
      '• **"Show critical problems"** — see the most serious ones',
      '• **"How many bugs?"** — get the total count',
      '• **"How do I fix [problem name]?"** — get steps to fix it',
      '• **"What does [problem name] mean?"** — get a simple explanation',
      '• **"Show page/link problems"** — see routing issues',
      '• **"Show image/video problems"** — see media issues',
      '• **"Show save problems"** — see data issues',
      '• **"What is critical?"** — understand what severity levels mean',
    ].join("\n");
  }

  // default fallback
  return [
    "I am not sure about that. Here are things you can ask me:\n",
    '• **"What is broken?"** — see all open problems',
    '• **"Show critical problems"** — see the most serious ones',
    '• **"How do I fix [problem name]?"** — get fix steps',
    '• **"What does [problem name] mean?"** — get a simple explanation',
    '• **"How many bugs are there?"** — get the total count',
    '\nType **"help"** to see the full list of questions.',
  ].join("\n");
}

// ─── simple markdown bold renderer ─────────────────────────────────────────

function MessageText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px] text-primary">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function ChatBubble({ message }) {
  const isBot = message.role === "bot";
  return (
    <div className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}>
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isBot ? "bg-primary/20 border border-primary/30" : "bg-white/10 border border-white/20"}`}>
        {isBot ? <Bot className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${isBot ? "bg-white/[0.05] border border-white/10 text-foreground/90 rounded-tl-sm" : "bg-primary/15 border border-primary/25 text-foreground rounded-tr-sm"}`}>
        {isBot
          ? message.text.split("\n").map((line, i) => (
              <span key={i} className="block"><MessageText text={line} />{i < message.text.split("\n").length - 1 && <br />}</span>
            ))
          : <span>{message.text}</span>
        }
        <p className="mt-1.5 text-[9px] text-muted-foreground/50">{message.time}</p>
      </div>
    </div>
  );
}

const STARTERS = [
  "What is broken?",
  "Show critical problems",
  "How many bugs are there?",
  "What does critical mean?",
  "Show page or link problems",
  "Help",
];

export default function QASentinelChat({ issues = [] }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      text: `Hello! 👋 I am your QA helper.\n\nI can explain any bug in simple words and tell you how to fix it.\n\nRight now there are **${issues.filter(i => !["fixed","ignored"].includes(i.status)).length} open problems** on the platform.\n\nWhat would you like to know?`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text) => {
    const userText = (text || input).trim();
    if (!userText) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [...prev, { id: Date.now(), role: "user", text: userText, time: now }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const reply = generateReply(userText, issues);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "bot", text: reply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      setLoading(false);
    }, 500);
  };

  const reset = () => {
    setMessages([{
      id: Date.now(),
      role: "bot",
      text: `Hello again! 👋 I am your QA helper.\n\nRight now there are **${issues.filter(i => !["fixed","ignored"].includes(i.status)).length} open problems**. What would you like to know?`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col" style={{ height: "72vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">QA Helper</p>
            <p className="text-[10px] text-emerald-400">● Online — Ask me anything about the bugs</p>
          </div>
        </div>
        <button type="button" onClick={reset} title="Start new chat" className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
          <RefreshCw className="w-3 h-3" /> New chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-white/[0.05] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick starters */}
      <div className="flex-shrink-0 px-5 pb-2 flex flex-wrap gap-1.5">
        {STARTERS.map((s) => (
          <button key={s} type="button" onClick={() => send(s)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-colors">
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-white/10 bg-white/[0.02] px-4 py-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask me about any bug…"
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:bg-white/[0.06] transition-colors"
        />
        <Button
          size="sm"
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="h-9 w-9 p-0 flex-shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
