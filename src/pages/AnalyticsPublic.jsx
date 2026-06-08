import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Ticket, Store, Eye, Brain, Activity } from 'lucide-react';

const metrics = [
  { label: 'Active Visitors', value: '12,847', change: '+23%', icon: Users, color: 'text-cyan-400' },
  { label: 'Tickets Sold', value: '3,215', change: '+18%', icon: Ticket, color: 'text-amber-400' },
  { label: 'Vendor Partners', value: '48', change: '+12%', icon: Store, color: 'text-emerald-400' },
  { label: 'Walkthrough Completions', value: '8,924', change: '+31%', icon: Eye, color: 'text-violet-400' },
  { label: 'AI Guide Sessions', value: '6,102', change: '+45%', icon: Brain, color: 'text-rose-400' },
  { label: 'Engagement Score', value: '87%', change: '+5%', icon: Activity, color: 'text-blue-400' },
];

const insights = [
  { title: 'Peak Engagement Hours', detail: 'Visitors are most active between 10am-2pm SGT, with a secondary peak at 7-9pm.' },
  { title: 'Top Exhibits', detail: 'Costume Gallery and Stage of Legends consistently rank as the most visited stations.' },
  { title: 'Conversion Funnel', detail: '72% of onboarded visitors proceed to walkthrough. 34% convert to ticket purchase.' },
  { title: 'AI Guide Effectiveness', detail: 'Visitors who interact with the AI guide are 2.4x more likely to complete all stations.' },
];

export default function AnalyticsPublic() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-primary font-mono text-xs uppercase tracking-[0.2em] mb-3">
            Analytics Intelligence Engine
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ecosystem Performance
          </motion.h1>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">
            Real-time insights into visitor engagement, conversion metrics, and ecosystem health.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono">
                    <TrendingUp className="w-3 h-3" />
                    {metric.change}
                  </div>
                </div>
                <div className="font-display text-3xl font-bold text-foreground mb-1">{metric.value}</div>
                <div className="text-muted-foreground font-body text-sm">{metric.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Insights */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-foreground text-center mb-8">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, i) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl border border-border bg-card"
              >
                <BarChart3 className="w-4 h-4 text-primary mb-3" />
                <h3 className="font-body font-semibold text-foreground mb-2">{insight.title}</h3>
                <p className="text-muted-foreground text-sm font-body leading-relaxed">{insight.detail}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}