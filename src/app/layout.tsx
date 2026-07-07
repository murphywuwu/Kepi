import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "客批 Kepi",
  description: "AI 驱动的客家文化自走棋",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full overflow-hidden font-sans">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
