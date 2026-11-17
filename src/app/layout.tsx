import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SIMBAS — Bank Sampah",
    template: "%s | SIMBAS",
  },
  description: "Sistem Informasi Manajemen Bank Sampah",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
