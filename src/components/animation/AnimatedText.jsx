const headingTags = new Set(["h1", "h2", "h3"]);

export default function AnimatedText({
  as = "p",
  children,
  className = "",
  delay = 0,
  duration = 0.9,
  important = false,
  viewport = undefined,
  ...props
}) {
  const Component = as;

  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
}