import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Diala - Voice Agent Platform",
  description: "AI-powered voice agents for business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider>
          {children}
          <Toaster
            position="top-right"
            theme="dark"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #475569',
              },
              classNames: {
                toast: 'bg-slate-800 text-slate-50 border-slate-600',
                success: 'bg-green-800 text-green-50 border-green-600',
                error: 'bg-red-800 text-red-50 border-red-600',
                warning: 'bg-yellow-800 text-yellow-50 border-yellow-600',
                info: 'bg-blue-800 text-blue-50 border-blue-600',
              },
            }}
          />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
