import { Inter } from 'next/font/google';
import '@/app/globals.css';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'SVT — Student Visa Tracker',
  description: 'Student Visa Processing & Financial Tracker — manage student applications, track visa status, and monitor earnings.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SVT Tracker',
  },
};

export const viewport = {
  themeColor: '#0a0e1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import PwaRegistry from '@/components/PwaRegistry';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <PwaRegistry />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
