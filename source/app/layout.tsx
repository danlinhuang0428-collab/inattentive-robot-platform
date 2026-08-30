import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inattentive Robot · Research Platform",
  description: "A local research, experience, and case archive platform for studying domestic robot attention conflicts.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
