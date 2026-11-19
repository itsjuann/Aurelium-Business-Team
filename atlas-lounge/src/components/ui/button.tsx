import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-[0.72rem] font-medium uppercase tracking-[0.2em] transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-charcoal text-ivory hover:bg-forest",
        bronze: "bg-bronze text-charcoal hover:bg-bronze-light",
        outline: "border border-charcoal/30 text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-ivory",
        "outline-light": "border border-ivory/35 text-ivory hover:border-ivory hover:bg-ivory hover:text-charcoal",
        link: "h-auto p-0 tracking-[0.18em] text-current underline decoration-bronze decoration-1 underline-offset-[6px] hover:decoration-2",
      },
      size: {
        default: "h-12 px-7",
        lg: "h-14 px-9",
        sm: "h-10 px-5",
      },
    },
    compoundVariants: [{ variant: "link", class: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
