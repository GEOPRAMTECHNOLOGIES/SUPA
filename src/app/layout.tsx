import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GreenMart — Fresh & Smart Supermarket | Geopram Technologies',
  description:
    'GreenMart is your modern green supermarket powered by Geopram Technologies. Shop fresh, pay smart with M-Pesa.',
  keywords: ['supermarket', 'greenmart', 'geopram', 'mpesa', 'kenya', 'fresh'],
  authors: [{ name: 'Kimathi Joram', url: 'mailto:celestakim018@gmail.com' }],
  themeColor: '#16a34a',
  openGraph: {
    title: 'GreenMart Supermarket',
    description: 'Shop fresh, pay smart.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans bg-white text-gray-900 antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              style: { background: '#16a34a', color: '#fff' },
              iconTheme: { primary: '#fff', secondary: '#16a34a' },
            },
            error: {
              style: { background: '#dc2626', color: '#fff' },
              iconTheme: { primary: '#fff', secondary: '#dc2626' },
            },
            duration: 4000,
          }}
        />
        {children}
      </body>
    </html>
  );
}
