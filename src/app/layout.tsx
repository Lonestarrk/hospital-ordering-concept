import type { Metadata, Viewport } from "next";
import { OrderProvider } from "@/components/OrderProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Måltider – beställ din mat",
  description: "Konceptprototyp: Ingrid beställer sjukhusmat på surfplatta.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF7F2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: webbläsartillägg (t.ex. ColorZilla) lägger egna attribut på
    // <body>, och appen sätter själv lang/dir/textstorlek på <html> efter laddning.
    <html lang="sv" data-text-size="normal" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <OrderProvider>{children}</OrderProvider>
      </body>
    </html>
  );
}
