export default function AnimatedSection({
  as = "section",
  children,
  className = "",
  delay = 0,
  duration = 1,
  viewport = undefined,
  ...props
}) {
  const Component = as;
  return <Component className={className} {...props}>{children}</Component>;
}