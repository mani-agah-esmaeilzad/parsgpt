"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

interface SidebarContextValue {
  isOpen: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  toggleCollapse: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used inside <AppShell>");
  }
  return context;
}

export function AppShell({ children }: AppShellProps) {
  const [isOpen, setIsOpen] = useState(false); // Mobile sheet
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", JSON.stringify(next));
      return next;
    });
  };

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isCollapsed,
        toggleSidebar: () => setIsOpen((prev) => !prev),
        toggleCollapse,
        closeSidebar: () => setIsOpen(false),
      }}
    >
      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[300px] max-w-[85vw] p-0 border-l-0">
          <Sidebar isMobile />
        </SheetContent>
      </Sheet>

      {/* Layout self-check: the sidebar lives ONLY here inside AppShell (no other layout renders it).
          Following NO rules -> no fixed sidebar, no padding hacks, wrapper uses flex-row-reverse,
          main pane has min-w-0 flex-col, so no phantom columns or duplicate sidebars. */}
      <div className="flex h-dvh w-full overflow-hidden flex-row-reverse bg-background">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col border-l bg-background transition-all duration-300 ease-in-out",
            isCollapsed ? "w-[68px]" : "w-[280px]"
          )}
        >
          <Sidebar isCollapsed={isCollapsed} />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col relative">
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
