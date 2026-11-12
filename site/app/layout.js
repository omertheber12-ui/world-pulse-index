import { Inter } from 'next/font/google';
import { Header, Transition } from './components/Chrome.js';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-inter', fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'] });

export const metadata = {
  title: 'World Pulse Index',
  description: 'Live public Polymarket figures and how they could touch a portfolio. Insights only, not advice.',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.variable + ' ' + inter.className}>
        <Header />
        <Transition>{children}</Transition>
      </body>
    </html>
  );
}
