
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { usePerformantAnimation } from "@/hooks/usePerformantAnimation";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "",
        link: "text-primary underline-offset-4",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface PerformantAnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const PerformantAnimatedButton = React.forwardRef<HTMLButtonElement, PerformantAnimatedButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const { elementRef, applyHoverAnimation } = usePerformantAnimation<HTMLButtonElement>();
    const Comp = asChild ? Slot : "button";

    React.useEffect(() => {
      const cleanup = applyHoverAnimation('button');
      return cleanup;
    }, [applyHoverAnimation]);

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={(node: HTMLButtonElement) => {
          // Handle both forwarded ref and internal ref
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          
          if (elementRef) {
            elementRef.current = node;
          }
        }}
        {...props}
      />
    );
  }
);
PerformantAnimatedButton.displayName = "PerformantAnimatedButton";

export { PerformantAnimatedButton, buttonVariants };
