"use client";

import RouteProtection from "../components/RouteProtection";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteProtection useLayout={true}>
      {children}
    </RouteProtection>
  );
}
