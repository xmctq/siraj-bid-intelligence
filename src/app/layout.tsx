import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Siraj · Bid Intelligence", template: "%s · Siraj" },
  description: "AI-powered review of government tenders and RFPs: requirements, compliance checklists, risks and a cited document assistant.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${geistMono.variable} antialiased`}>
      <body>
        <TooltipProvider delayDuration={200}>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
