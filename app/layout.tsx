import type { Metadata } from 'next'
import { Noto_Sans, Lexend } from 'next/font/google'
import "./globals.css"
const body = Noto_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
})

const display = Lexend({
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '700'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Tài Chính Gia Đình',
  description: 'Quản lý thu chi thông minh cho cả gia đình',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${body.variable} ${display.variable}`}>{children}</body>
    </html>
  )
}