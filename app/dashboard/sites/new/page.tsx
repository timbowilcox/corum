'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { SiteType } from '@/types'

const SITE_TYPES: { value: SiteType; label: string; description: string }[] = [
  { value: 'farm', label: 'Farm', description: 'Agricultural growing operation' },
  { value: 'packhouse', label: 'Packhouse', description: 'Post-harvest handling & packing' },
  { value: 'factory', label: 'Factory', description: 'Processing or manufacturing facility' },
  { value: 'warehouse', label: 'Warehouse', description: 'Storage & distribution' },
  { value: 'office', label: 'Office', description: 'Administrative location' },
]

const COUNTRIES = [
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'TH', label: 'Thailand' },
  { value: 'PH', label: 'Philippines' },
  { value: 'IN', label: 'India' },
  { value: 'OTHER', label: 'Other' },
]

const schema = z.object({
  name: z.string().min(2, 'Site name must be at least 2 characters'),
  site_type: z.enum(['farm', 'packhouse', 'factory', 'warehouse', 'office'] as const),
  country: z.string().min(1, 'Please select a country'),
  address: z.string().optional(),
  employee_count: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function NewSitePage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { country: 'AU' },
  })

  const selectedType = watch('site_type')
  const selectedCountry = watch('country')

  async function onSubmit(values: FormValues) {
    setServerError('')
    const payload = {
      ...values,
      employee_count:
        values.employee_count === '' || values.employee_count === undefined
          ? null
          : parseInt(values.employee_count, 10),
    }
    const res = await fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setServerError(data.error ?? 'Failed to create site')
      return
    }

    const data = (await res.json()) as { site: { id: string } }
    router.push(`/dashboard/sites/${data.site.id}/intake`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard/sites"
          className="text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Add a new site</h1>
          <p className="text-zinc-500 text-sm">After creating your site, we&apos;ll start the readiness assessment.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Site details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Site name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Yarra Valley Packhouse"
                  {...register('name')}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address (optional)</Label>
                <Input
                  id="address"
                  placeholder="123 Farm Road, Yarra Valley VIC 3770"
                  {...register('address')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_count">Number of employees (optional)</Label>
                <Input
                  id="employee_count"
                  type="number"
                  min="0"
                  placeholder="e.g. 45"
                  {...register('employee_count')}
                  aria-invalid={!!errors.employee_count}
                />
                {errors.employee_count && (
                  <p className="text-sm text-red-600">{String(errors.employee_count.message)}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Site type</CardTitle>
              <CardDescription>This helps us tailor the assessment questions to your operation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {SITE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setValue('site_type', t.value, { shouldValidate: true })}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      selectedType === t.value
                        ? 'border-[#0D3B2E] bg-[#0D3B2E]/5'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="font-medium text-zinc-900">{t.label}</div>
                    <div className="text-sm text-zinc-500">{t.description}</div>
                  </button>
                ))}
              </div>
              {errors.site_type && (
                <p className="text-sm text-red-600 mt-2">{errors.site_type.message}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Country</CardTitle>
              <CardDescription>Used to apply the correct regulatory context to your analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setValue('country', c.value, { shouldValidate: true })}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium text-left transition-colors ${
                      selectedCountry === c.value
                        ? 'border-[#0D3B2E] bg-[#0D3B2E]/5 text-[#0D3B2E]'
                        : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {errors.country && (
                <p className="text-sm text-red-600 mt-2">{errors.country.message}</p>
              )}
            </CardContent>
          </Card>

          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white h-12 text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating site...' : 'Create site & start assessment'}
          </Button>
        </div>
      </form>
    </div>
  )
}
