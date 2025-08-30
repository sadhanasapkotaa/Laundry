"use client";

import * as React from "react";
import { cn } from "../utils/utils";

interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Context to manage open state
 */
const DropdownContext = React.createContext<{
  open: boolean;
  toggle: () => void;
  close: () => void;
} | null>(null);

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, className }) => {
  const [open, setOpen] = React.useState(false);

  const toggle = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

  // Close on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-dropdown-root]')) close();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <DropdownContext.Provider value={{ open, toggle, close }}>
      <div data-dropdown-root className={cn("relative inline-block", className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

/**
 * Trigger button
 */
export const DropdownMenuTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error("DropdownMenuTrigger must be inside DropdownMenu");

  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={context.open}
      onClick={context.toggle}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 transition",
        className
      )}
    >
      {children}
    </button>
  );
};

/**
 * Dropdown content
 */
export const DropdownMenuContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error("DropdownMenuContent must be inside DropdownMenu");

  return context.open ? (
    <ul
      role="menu"
      tabIndex={-1}
      className={cn(
        "absolute mt-2 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-lg border p-1 outline-none z-50 animate-fadeIn",
        className
      )}
      style={{ top: '100%' }}
    >
      {children}
    </ul>
  ) : null;
};

/**
 * Menu item
 */
export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  onSelect,
  disabled,
  className,
}) => {
  const ref = React.useRef<HTMLLIElement>(null);
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error("DropdownMenuItem must be inside DropdownMenuContent");

  const handleClick = () => {
    if (!disabled) {
      onSelect?.();
      context.close();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <li
      ref={ref}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      className={cn(
        "relative flex items-center px-2 py-1.5 text-sm rounded-md cursor-pointer select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </li>
  );
};

/**
 * Divider
 */
export const DropdownMenuSeparator: React.FC<{ className?: string }> = ({ className }) => {
  return <li className={cn("h-px my-1 bg-gray-200 dark:bg-gray-700", className)} role="separator" />;
};

/**
 * Shortcut text
 */
export const DropdownMenuShortcut: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <span className={cn("ml-auto text-xs text-gray-500 dark:text-gray-400", className)}>{children}</span>;
};
