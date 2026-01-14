import { ReactNode } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/next";

interface LoginLayoutProps {
  children: ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <div className="login-layout">
      {children}
    </div>
  );
}
