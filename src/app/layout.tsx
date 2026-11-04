import type { Metadata } from 'next';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import './globals.css';
import './cesium.css';
export const metadata: Metadata = {
  title: 'TerraShift — Understand Your Land. Explore Your Future.',
  description:
    'An educational Earth observation and crop-rotation laboratory. Explore NASA data, replay climates, and inspect transparent agricultural models.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/vendor/cesium/Widgets/widgets.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
