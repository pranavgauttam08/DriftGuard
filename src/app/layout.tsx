import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "DriftGuard — Behavioral Version Control for AI",
  description: "Fingerprint, diff, and gate AI deployments. Catch behavioral regressions before your users do.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#00FFD1',
          colorBackground: '#010D10',
          colorInputBackground: '#011418',
          colorInputText: '#E0F2F1',
          colorText: '#E0F2F1',
          colorTextSecondary: '#5A7A7D',
          borderRadius: '12px',
          fontFamily: '"DM Sans", sans-serif',
        },
        elements: {
          card: { backgroundColor: 'rgba(1,20,24,0.95)', border: '1px solid rgba(0,255,209,0.12)', backdropFilter: 'blur(20px)', boxShadow: '0 0 40px rgba(0,255,209,0.05)' },
          headerTitle: { color: '#E0F2F1' },
          headerSubtitle: { color: '#5A7A7D' },
          socialButtonsBlockButton: { backgroundColor: 'rgba(0,255,209,0.06)', border: '1px solid rgba(0,255,209,0.15)', color: '#E0F2F1' },
          formButtonPrimary: { background: 'linear-gradient(135deg, rgba(0,255,209,0.2), rgba(0,229,255,0.15))', border: '1px solid rgba(0,255,209,0.4)', color: '#00FFD1', boxShadow: '0 0 20px rgba(0,255,209,0.15)' },
          footerActionLink: { color: '#00FFD1' },
          identityPreviewEditButton: { color: '#00FFD1' },
          formFieldInput: { backgroundColor: 'rgba(0,255,209,0.04)', border: '1px solid rgba(0,255,209,0.15)', color: '#E0F2F1' },
          formFieldLabel: { color: '#5A7A7D' },
          dividerLine: { backgroundColor: 'rgba(0,255,209,0.1)' },
          dividerText: { color: '#3A5A5D' },
          userButtonPopoverCard: { backgroundColor: '#010D10', border: '1px solid rgba(0,255,209,0.12)' },
          userButtonPopoverActionButton: { color: '#E0F2F1' },
          userButtonPopoverActionButtonText: { color: '#E0F2F1' },
          userButtonPopoverFooter: { display: 'none' },
        },
      }}
    >
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet" />
        </head>
        <body className="bg-[var(--color-abyss)] text-[var(--color-surface-text)] antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
