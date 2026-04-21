import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

interface MiddlewareSettings {
  maintenance: boolean
  maintenance_message: string
  inscription_ouverte: boolean
  admin_ip_whitelist: string
}

let settingsCache: { data: MiddlewareSettings; ts: number } | null = null

async function getMiddlewareSettings(): Promise<MiddlewareSettings> {
  const now = Date.now()
  if (settingsCache && now - settingsCache.ts < 30_000) return settingsCache.data
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=settings`,
      {
        headers: {
          apikey:        process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        cache: 'no-store',
      },
    )
    const data = await res.json()
    const s = (data[0]?.settings ?? {}) as Record<string, unknown>
    const result: MiddlewareSettings = {
      maintenance:         s.maintenance === true,
      maintenance_message: typeof s.maintenance_message === 'string' ? s.maintenance_message : 'Le site est en maintenance, revenez bientôt.',
      inscription_ouverte: s.inscription_ouverte !== false,
      admin_ip_whitelist:  typeof s.admin_ip_whitelist === 'string' ? s.admin_ip_whitelist : '',
    }
    settingsCache = { data: result, ts: now }
    return result
  } catch {
    return { maintenance: false, maintenance_message: '', inscription_ouverte: true, admin_ip_whitelist: '' }
  }
}

function isAdminUser(user: { email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } | null): boolean {
  if (!user) return false
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  return (
    user.user_metadata?.role === 'admin' ||
    user.app_metadata?.role  === 'admin' ||
    adminEmails.includes(user.email ?? '')
  )
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    ''
  )
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const settings = await getMiddlewareSettings()

  // ── Mode maintenance ──────────────────────────────────────
  const isMaintenanceExempt = pathname.startsWith('/maintenance') || pathname.startsWith('/auth') || pathname.startsWith('/admin')
  if (!isMaintenanceExempt && settings.maintenance && !isAdminUser(user)) {
    const url = request.nextUrl.clone()
    url.pathname = '/maintenance'
    return NextResponse.redirect(url)
  }

  // ── Inscription fermée → bloquer /auth/register ───────────
  if (pathname.startsWith('/auth/register') && !settings.inscription_ouverte) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('info', 'inscription_fermee')
    return NextResponse.redirect(url)
  }

  // ── Routes nécessitant une connexion ─────────────────────
  const protectedRoutes = ['/compte', '/publier']
  if (protectedRoutes.some(r => pathname.startsWith(r)) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // ── Routes admin ──────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    if (!isAdminUser(user)) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    // IP whitelist admin (si configurée)
    const whitelist = settings.admin_ip_whitelist
      .split(',').map(s => s.trim()).filter(Boolean)
    if (whitelist.length > 0) {
      const clientIp = getClientIp(request)
      if (clientIp && !whitelist.includes(clientIp)) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
