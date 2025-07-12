import * as React from "react";

interface TabsProps {
  children: React.ReactNode;
  className?: string;
}
export function Tabs({ children, className }: TabsProps) {
  return <div className={className}>{children}</div>;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}
export function TabsList({ children, className }: TabsListProps) {
  return <div className={className} role="tablist">{children}</div>;
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isActive?: boolean;
}
export function TabsTrigger({ children, isActive, ...props }: TabsTriggerProps) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  children: React.ReactNode;
  hidden?: boolean;
  className?: string;
}
export function TabsContent({ children, hidden, className }: TabsContentProps) {
  if (hidden) return null;
  return <div className={className} role="tabpanel">{children}</div>;
} 