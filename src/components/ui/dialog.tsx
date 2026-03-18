"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-bpim-bg/60 backdrop-blur-sm duration-100",
        "data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  placement = "center",
  disableScrollWrapper = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  placement?: "center" | "bottom-sheet";
  disableScrollWrapper?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed z-50 grid gap-4 bg-bpim-surface text-bpim-text",
          "text-sm ring-1 ring-bpim-border duration-100 outline-none",
          "data-open:animate-in data-open:fade-in-0",
          "data-closed:animate-out data-closed:fade-out-0",

          placement === "center" && [
            "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-[calc(100%-2rem)] rounded-xl p-4 sm:max-w-sm",
            "data-open:zoom-in-95 data-closed:zoom-out-95",
          ],

          placement === "bottom-sheet" && [
            "inset-x-0 bottom-0 top-auto w-full rounded-t-2xl p-0",
            "translate-x-0 translate-y-0",
            "flex flex-col max-h-[90svh] overflow-hidden",
            "data-open:slide-in-from-bottom-10 data-closed:slide-out-to-bottom-10",
            "md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2",
            "md:-translate-x-1/2 md:-translate-y-1/2",
            "md:max-w-md md:rounded-2xl md:flex-none md:max-h-[85svh]",
            "md:data-open:zoom-in-95 md:data-closed:zoom-out-95",
          ],

          className,
        )}
        {...props}
      >
        {placement === "bottom-sheet" ? (
          <>
            <div className="mx-auto mt-3 mb-1 h-1 w-10 shrink-0 rounded-full bg-bpim-border md:hidden" />
            {disableScrollWrapper ? (
              <>{children}</>
            ) : (
              <div className="overflow-y-auto overscroll-contain flex-1">
                {children}
              </div>
            )}
          </>
        ) : (
          children
        )}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl",
        "border-t border-bpim-border bg-bpim-surface-2/50 p-4",
        "sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-base leading-none font-medium text-bpim-text",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-bpim-muted *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-bpim-text",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
