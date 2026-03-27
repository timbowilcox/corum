'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  orgName: z.string().min(2, 'Organisation name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError('')

    // Sign up the user
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    })

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered')) {
        setServerError('An account with this email already exists.')
      } else {
        setServerError(signUpError.message)
      }
      return
    }

    if (!authData.user) {
      setServerError('Registration failed. Please try again.')
      return
    }

    // Create org + user profile via API route (needs service role)
    const res = await fetch('/api/sites/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authData.user.id,
        fullName: values.fullName,
        orgName: values.orgName,
      }),
    })

    if (!res.ok) {
      setServerError('Failed to create your organisation. Please contact support.')
      return
    }

    router.push('/dashboard/sites')
    router.refresh()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-[#0D3B2E]">Create your Corum account</CardTitle>
        <CardDescription>
          Start your SMETA readiness journey. Free to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Your name</Label>
            <Input
              id="fullName"
              placeholder="Jane Smith"
              {...register('fullName')}
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && (
              <p className="text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgName">Organisation name</Label>
            <Input
              id="orgName"
              placeholder="Yarra Valley Farms Pty Ltd"
              {...register('orgName')}
              aria-invalid={!!errors.orgName}
            />
            {errors.orgName && (
              <p className="text-sm text-red-600">{errors.orgName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              {...register('password')}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#0D3B2E] font-medium underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
