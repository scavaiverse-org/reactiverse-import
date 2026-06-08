import { motion } from "framer-motion";

export default function CinematicEnvironment({ progress = 0, backgroundUrl = "" }) {
  const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(backgroundUrl || "");
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {backgroundUrl && (
        isVideo ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={backgroundUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img className="absolute inset-0 h-full w-full object-cover" src={backgroundUrl} alt="" />
        )
      )}
      <motion.div
        className="absolute inset-[-10%] bg-[radial-gradient(circle_at_50%_30%,rgba(210,218,228,0.08),transparent_32%),radial-gradient(circle_at_20%_70%,rgba(210,218,228,0.04),transparent_28%),radial-gradient(circle_at_80%_65%,rgba(180,190,204,0.05),transparent_30%)]"
        animate={{ scale: [1, 1.05, 1], rotate: [0, 1.5, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/65 to-background" />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"
        animate={{ scale: 1 + progress * 0.12, opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      {[...Array(18)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary/35"
          style={{ left: `${8 + (i * 17) % 86}%`, top: `${12 + (i * 23) % 76}%` }}
          animate={{ y: [0, -24, 0], opacity: [0.15, 0.7, 0.15], scale: [1, 1.8, 1] }}
          transition={{ duration: 4 + (i % 5), repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-primary/10 to-transparent blur-xl" />
    </div>
  );
}