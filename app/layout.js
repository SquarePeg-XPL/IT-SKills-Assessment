export const metadata = {
  title: 'IT Skills Assessment',
  description: 'Comprehensive IT skills evaluation tool',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}