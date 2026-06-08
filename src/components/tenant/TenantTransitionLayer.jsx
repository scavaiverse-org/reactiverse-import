import { motion } from "framer-motion";

export default function TenantTransitionLayer() {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[80] bg-background"
      initial={{ opacity: 1, clipPath: "inset(0 0 0 0)" }}
      animate={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}