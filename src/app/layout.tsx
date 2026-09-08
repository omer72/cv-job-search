import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV → Job Match",
  description:
    "Upload your CV, get concrete improvements, then see which openings at the companies you care about actually fit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
