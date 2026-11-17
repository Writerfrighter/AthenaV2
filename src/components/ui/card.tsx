import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * "section" (default) is the app's flat look: a hairline rule above a headed
 * block, no box. "panel" is a white rounded box for touch-heavy surfaces such
 * as the scouting forms.
 */
function Card({
  className,
  size = "default",
  variant = "section",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  variant?: "section" | "panel"
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(
        "group/card flex flex-col gap-(--card-gap) text-sm text-card-foreground [--card-gap:--spacing(4)] data-[size=sm]:[--card-gap:--spacing(3)]",
        "data-[variant=section]:border-t data-[variant=section]:pt-5 data-[variant=section]:[--card-px:0px]",
        "data-[variant=panel]:overflow-hidden data-[variant=panel]:rounded-2xl data-[variant=panel]:border data-[variant=panel]:bg-card data-[variant=panel]:py-5 data-[variant=panel]:[--card-px:--spacing(5)] data-[variant=panel]:has-data-[slot=card-footer]:pb-0",
        "*:[img:first-child]:rounded-t-2xl *:[img:last-child]:rounded-b-2xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 px-(--card-px) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-gap)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-lg leading-snug font-semibold tracking-[-0.01em] group-data-[size=sm]/card:text-[15px]",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[13px] text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-px)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center border-t border-border/60 px-(--card-px) py-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
