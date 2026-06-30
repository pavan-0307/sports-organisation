export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body className="bg-white text-black p-4">{children}</body>
    </html>
  );
}
