import type { Metadata, Viewport } from "next";
import { OrderProvider } from "@/components/OrderProvider";
import { PwaSetup } from "@/components/Install";
import { PullToRefresh } from "@/components/PullToRefresh";
import { UpdateChecker } from "@/components/UpdateChecker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Måltider – beställ din mat",
  description: "Konceptprototyp: Ingrid beställer sjukhusmat på surfplatta.",
  applicationName: "Måltider",
  appleWebApp: { capable: true, title: "Måltider", statusBarStyle: "default" },
  icons: {
    icon: "/ikoner/ikon-192.png",
    apple: "/ikoner/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f6b4f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: webbläsartillägg (t.ex. ColorZilla) lägger egna attribut på
    // <body>, och appen sätter själv lang/dir/textstorlek på <html> efter laddning.
    <html lang="sv" data-text-size="normal" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <PwaSetup />
        <PullToRefresh />
        <OrderProvider>
          {children}
          <UpdateChecker />
        </OrderProvider>
      </body>
    </html>
  );
}
