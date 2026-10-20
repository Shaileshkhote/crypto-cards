import type { ReactNode } from "react";
import "./globals.css";
export const metadata = {
  title: "Crypto Cards · Admin",
  description: "Source-backed crypto card data and review",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
