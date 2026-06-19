import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'ReelNet — Premium Streaming Guide',
  description: 'Discover, vote, and rank the best Netflix shows and movies. Your ultimate guide to what to watch next.',
  openGraph: {
    title: 'ReelNet — Premium Streaming Guide',
    description: 'Discover, vote, and rank the best Netflix shows and movies.',
    url: 'https://reelnet-premium.vercel.app',
    siteName: 'ReelNet',
    images: [{ url: '/logo.png' }],
    type: 'website',
  },
  verification: {
    google: '2QYuMKu6_8y01hoQ8454mwXrbDdRo-64a6PYTK96zZM',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className={inter.className}>
        <script dangerouslySetInnerHTML={{__html: `
          document.addEventListener('contextmenu', event => event.preventDefault());
          document.addEventListener('keydown', event => {
            if ((event.ctrlKey || event.metaKey) && ['c', 'a', 's', 'x'].includes(event.key.toLowerCase())) {
              event.preventDefault();
            }
          });
        `}} />
        <div id="particle-container" className="particle-container"></div>
        {children}
      </body>
    </html>
  );
}
