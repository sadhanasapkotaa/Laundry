import { ReactNode } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/next";
interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="public-layout">
      {children}
    </div>
  );
}
