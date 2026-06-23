import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "DriftGuard — Enterprise AI Governance & Compliance Platform",
  description: "Govern, measure, and prove every AI system. Behavioral version control, compliance automation, cost intelligence — from a single control tower.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#3B82F6',
          colorBackground: '#0D1117',
          colorInputBackground: '#161B27',
          colorInputText: '#F1F5F9',
          colorText: '#F1F5F9',
          colorTextSecondary: '#94A3B8',
          borderRadius: '8px',
          fontFamily: '"Inter", system-ui, sans-serif',
        },
        elements: {
          card: { backgroundColor: '#0D1117', border: '1px solid #1E2536', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' },
          headerTitle: { color: '#F1F5F9' },
          headerSubtitle: { color: '#94A3B8' },
          socialButtonsBlockButton: { backgroundColor: '#161B27', border: '1px solid #252D3D', color: '#F1F5F9' },
          formButtonPrimary: { background: '#3B82F6', border: '1px solid #3B82F6', color: '#fff', boxShadow: '0 0 20px rgba(59,130,246,0.2)' },
          footerActionLink: { color: '#3B82F6' },
          identityPreviewEditButton: { color: '#3B82F6' },
          formFieldInput: { backgroundColor: '#161B27', border: '1px solid #252D3D', color: '#F1F5F9' },
          formFieldLabel: { color: '#94A3B8' },
          dividerLine: { backgroundColor: '#1E2536' },
          dividerText: { color: '#475569' },
          userButtonPopoverCard: { backgroundColor: '#0D1117', border: '1px solid #1E2536' },
          userButtonPopoverActionButton: { color: '#F1F5F9' },
          userButtonPopoverActionButtonText: { color: '#F1F5F9' },
          userButtonPopoverFooter: { display: 'none' },
        },
      }}
    >
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        </head>
        <body className="bg-[var(--color-bg-base)] text-[var(--color-text-primary)] antialiased">
          {children}
          <Toaster position="bottom-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
