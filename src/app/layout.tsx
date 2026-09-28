import type { Metadata } from 'next';
import './globals.css';
import { SettingsProvider } from '@/context/SettingsContext';

export const metadata: Metadata = {
  title: 'NeuroDiagnosis — Clinical Intelligence',
  description: 'AI-powered clinical decision support for neurodegenerative disease assessment',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('neuro_theme');
                if (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  theme = 'dark';
                }
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.add('light');
                }
                var fontSize = localStorage.getItem('neuro_font_size') || 'medium';
                document.documentElement.setAttribute('data-font-size', fontSize);
                document.documentElement.classList.add('font-' + fontSize);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
