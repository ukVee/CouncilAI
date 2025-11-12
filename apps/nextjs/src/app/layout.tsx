import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ForgeAthena Dashboard",
  description: "Real-time operational cockpit for the ForgeAthena stack"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
