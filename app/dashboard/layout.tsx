
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import "../globals.css"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar user={{ name: session.name, email: session.email, role: session.role }} />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px' }}>
        {children}
      </main>
    </div>
  )
}