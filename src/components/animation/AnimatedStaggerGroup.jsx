import { Children, cloneElement, isValidElement } from "react";

export default function AnimatedStaggerGroup({
  as = "div",
  children,
  className = "",
  childClassName = "",
  delayStep = 0.1,
  duration = 0.85,
  viewport = undefined,
  ...props
}) {
  const Component = as;

  return (
    <Component className={className} {...props}>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;
        return (
          <div className={childClassName}>
            {cloneElement(child)}
          </div>
        );
      })}
    </Component>
  );
}