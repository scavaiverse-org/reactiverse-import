export default function AnimatedPageShell({ children, className = "", delay = 0, duration = 0.6, ...props }) {
  return <div className={className} {...props}>{children}</div>;
}