import { describe, it, expect } from 'vitest'
import { getCountryContext } from '@/lib/smeta/country-context'

describe('getCountryContext', () => {
  it('CC1: AU returns string containing Fair Work Act', () => {
    const ctx = getCountryContext('AU')
    expect(ctx).not.toBeNull()
    expect(ctx).toContain('Fair Work Act')
  })

  it('CC2: TH returns string containing Labour Protection Act', () => {
    const ctx = getCountryContext('TH')
    expect(ctx).not.toBeNull()
    expect(ctx).toContain('Labour Protection Act')
  })

  it('CC3: BR (unsupported) returns null', () => {
    const ctx = getCountryContext('BR')
    expect(ctx).toBeNull()
  })

  it('CC4: empty string returns null', () => {
    const ctx = getCountryContext('')
    expect(ctx).toBeNull()
  })

  it('NZ returns non-null context', () => {
    const ctx = getCountryContext('NZ')
    expect(ctx).not.toBeNull()
  })

  it('GB returns non-null context containing Modern Slavery Act', () => {
    const ctx = getCountryContext('GB')
    expect(ctx).not.toBeNull()
    expect(ctx).toContain('Modern Slavery Act')
  })
})
