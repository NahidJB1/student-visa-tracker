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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
