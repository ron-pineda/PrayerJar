'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SidebarDrawerProps {
  churchName: string;
  children: React.ReactNode; // sidebar content rendered by ChurchSidebar (server)
}

function HamburgerIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function SidebarDrawer({ churchName, children }: SidebarDrawerProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="lg:hidden">
      {/* Sticky mini-bar below global header */}
      <div className="sticky top-14 z-20 flex items-center gap-3 border-b bg-background px-4 h-11">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          aria-label="Open navigation menu"
        >
          <HamburgerIcon />
        </button>
        <span className="text-sm font-medium truncate">{churchName}</span>
      </div>

      {/* Drawer overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 z-50 flex">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
