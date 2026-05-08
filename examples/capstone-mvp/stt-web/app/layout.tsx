export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <style>{`* { box-sizing: border-box; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; margin: 0; }`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
