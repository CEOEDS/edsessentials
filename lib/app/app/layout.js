import './globals.css';
import { Inter, Bodoni_Moda } from 'next/font/google';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const display = Bodoni_Moda({ subsets: ['latin'], variable: '--font-display' });

export const metadata = {
  title: "ED'S ESSENTIALS | Style that speaks for itself",
  description: "Premium contemporary fashion and everyday essentials. Embrace your style, frame your moments.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
