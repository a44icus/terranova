import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isAdminUser } from '@/lib/isAdmin'
import { getClientIp } from '@/lib/clientIp'
import { checkCronAuth } from '@/lib/cronAuth'
import { rateLimitKey } from '@/lib/emailRateLimit'
import { escHtml, escHtmlMultiline, isEmail } from '@/lib/emails'

const env = { ...process.env }
beforeEach(() => { process.env.ADMIN_EMAILS = 'admin@exemple.fr, autre@exemple.fr'; process.env.CRON_SECRET = 'secret-de-test' })
afterEach(() => { process.env = { ...env } })

const req = (headers: Record<string, string>) => new Request('https://exemple.fr/api', { headers })

describe('isAdminUser', () => {
  it('reconnaît app_metadata.role et ADMIN_EMAILS', () => {
    expect(isAdminUser({ email: 'x@y.fr', app_metadata: { role: 'admin' } })).toBe(true)
    expect(isAdminUser({ email: 'autre@exemple.fr', app_metadata: {} })).toBe(true)
  })

  it('ignore user_metadata, modifiable par l’utilisateur', () => {
    const user = { email: 'x@y.fr', app_metadata: {}, user_metadata: { role: 'admin' } }
    expect(isAdminUser(user)).toBe(false)
    expect(isAdminUser(null)).toBe(false)
  })
})

describe('getClientIp', () => {
  it('préfère x-real-ip, puis le dernier maillon de x-forwarded-for', () => {
    expect(getClientIp(req({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.9' }))).toBe('1.1.1.1')
    expect(getClientIp(req({ 'x-forwarded-for': '6.6.6.6, 2.2.2.2' }))).toBe('2.2.2.2')
    expect(getClientIp(req({}))).toBe('')
  })
})

describe('checkCronAuth', () => {
  it('accepte x-cron-secret et Authorization: Bearer (Vercel Cron)', () => {
    expect(checkCronAuth(req({ 'x-cron-secret': 'secret-de-test' }), 't')).toBeNull()
    expect(checkCronAuth(req({ authorization: 'Bearer secret-de-test' }), 't')).toBeNull()
  })

  it('refuse un secret faux ou absent', () => {
    expect(checkCronAuth(req({ 'x-cron-secret': 'faux' }), 't')?.status).toBe(401)
    expect(checkCronAuth(req({}), 't')?.status).toBe(401)
  })

  it('refuse tout si CRON_SECRET n’est pas configuré', () => {
    delete process.env.CRON_SECRET
    expect(checkCronAuth(req({ 'x-cron-secret': '' }), 't')?.status).toBe(500)
  })
})

describe('rateLimitKey', () => {
  it('compte un utilisateur connecté par compte, sinon par IP', () => {
    expect(rateLimitKey(req({ 'x-real-ip': '1.1.1.1' }), 'u1')).toBe('user:u1')
    expect(rateLimitKey(req({ 'x-real-ip': '1.1.1.1' }))).toBe('ip:1.1.1.1')
  })
})

describe('emails', () => {
  it('échappe le HTML', () => {
    expect(escHtml('<script>"a"&\'b\'</script>')).toBe('&lt;script&gt;&quot;a&quot;&amp;&#x27;b&#x27;&lt;/script&gt;')
    expect(escHtml(42)).toBe('42')
    expect(escHtml({ x: 1 })).toBe('')
    expect(escHtmlMultiline('a\n<b>')).toBe('a<br/>&lt;b&gt;')
  })

  it('valide les emails', () => {
    expect(isEmail('a@b.fr')).toBe(true)
    expect(isEmail('pas un email')).toBe(false)
    expect(isEmail('a'.repeat(250) + '@b.fr')).toBe(false)
  })
})
