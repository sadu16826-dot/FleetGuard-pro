import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FleetGuard Pro | Fleet Management & Vehicle Safety",
  description: "Monitor vehicles, manage drivers, automate maintenance alerts and improve fleet safety with one intelligent platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
