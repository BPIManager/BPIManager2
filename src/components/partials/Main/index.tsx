"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { SidebarContent } from "../Sidebar";
import { NotificationBell } from "../Notifications";
import { UserMenu } from "../UserMenu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BpimLogo } from "@/components/ui/bpim-logo";
import { cn } from "@/lib/utils";

export const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);

  useEffect(() => {
    setSidebarPinned(localStorage.getItem("sidebar-pinned") === "true");
  }, []);

  const togglePin = () => {
    setSidebarPinned((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-pinned", String(next));
      return next;
    });
  };

  const isExpanded = sidebarPinned || sidebarHovered;

  return (
    <div
      className="flex h-svh w-full overflow-hidden"
      style={{ background: "var(--bpim-bg-gradient, hsl(var(--bpim-bg)))" }}
    >
      <aside
        className={cn(
          "relative hidden shrink-0 md:block",
          sidebarPinned ? "w-70" : "w-14",
        )}
      >
        <div
          className={cn(
            "group/sidebar absolute left-0 top-0 z-1000 flex h-full flex-col overflow-hidden border-r border-bpim-border bg-bpim-surface transition-[width] duration-200 ease-in-out",
            sidebarPinned ? "w-70" : "w-14 hover:w-70 hover:shadow-xl",
          )}
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
        >
          <SidebarContent
            expanded={isExpanded}
            pinned={sidebarPinned}
            onTogglePin={togglePin}
          />
        </div>
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
                className="w-70 border-r-bpim-border bg-bpim-surface p-0"
              >
                <SidebarContent
                  onClose={() => setOpen(false)}
                  expanded={true}
                />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <BpimLogo size={32} />
              <span className="text-xl font-bold tracking-tight text-bpim-text">
                BPIM2
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto outline-none">
          <div className="mx-auto w-full max-w-full">{children}</div>
        </div>
      </div>
    </div>
  );
};
