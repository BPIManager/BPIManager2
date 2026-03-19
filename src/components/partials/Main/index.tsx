"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { SidebarContent } from "../Sidebar";
import { NotificationBell } from "../Notifications";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="flex h-[100svh] w-full overflow-hidden"
      style={{ background: "var(--bpim-bg-gradient, hsl(var(--bpim-bg)))" }}
    >
      <aside className="hidden w-[280px] shrink-0 border-r border-bpim-border bg-bpim-surface md:block">
        <SidebarContent />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-bpim-border bg-bpim-surface px-4">
          <div className="flex items-center gap-4">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open Menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[280px] border-r-bpim-border bg-bpim-surface p-0"
              >
                <SidebarContent onClose={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <span className="text-xl font-bold tracking-tight text-bpim-text">
              BPIM2
            </span>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto outline-none">
          <div className="mx-auto w-full max-w-full">{children}</div>
        </div>
      </div>
    </div>
  );
};
