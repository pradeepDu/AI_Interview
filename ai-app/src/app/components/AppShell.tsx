"use client";
import { usePathname } from "next/navigation";
import { NavBar } from "./NavBar";

// Pages that should NOT show the NavBar
const NO_NAVBAR_PATHS = ["/", "/login", "/signup"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !NO_NAVBAR_PATHS.includes(pathname);

  return (
    <>
      {showNav && <NavBar />}
      {children}
    </>
  );
}
