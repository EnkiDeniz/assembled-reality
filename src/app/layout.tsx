export const metadata = {
  title: 'Assembled Reality',
  description: 'assembledreality.com',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
