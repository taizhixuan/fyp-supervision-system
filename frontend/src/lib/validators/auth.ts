import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Please enter your MMU ID or email'),
  password: z.string().min(1, 'Please enter your password'),
  rememberMe: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const STUDENT_SPECIALISATIONS = [
  'Software Engineering',
  'Data Science',
  'Cybersecurity',
  'Game Development',
  'Information Systems',
] as const

const _currentYear = new Date().getFullYear()
export const INTAKE_YEAR_MIN = _currentYear - 8
export const INTAKE_YEAR_MAX = _currentYear

export const registerSchema = z
  .object({
    role: z.enum(['STUDENT', 'SUPERVISOR'], {
      required_error: 'Please select your role',
    }),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    mmuId: z.string().regex(/^\d{10}$/, 'MMU ID must be 10 digits'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional(),
    specialisation: z.string().optional(),
    intakeYear: z.preprocess((v) => {
      if (v === undefined || v === '' || v === null) return undefined
      const n = typeof v === 'number' ? v : Number.parseInt(String(v), 10)
      return Number.isFinite(n) ? n : undefined
    }, z.number().int().optional()),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .superRefine((data, ctx) => {
    if (data.role !== 'STUDENT') return
    if (
      !data.specialisation ||
      !(STUDENT_SPECIALISATIONS as readonly string[]).includes(data.specialisation)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['specialisation'],
        message: 'Please select your specialisation',
      })
    }
    if (
      data.intakeYear === undefined ||
      data.intakeYear < INTAKE_YEAR_MIN ||
      data.intakeYear > INTAKE_YEAR_MAX
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['intakeYear'],
        message: `Intake year must be between ${INTAKE_YEAR_MIN} and ${INTAKE_YEAR_MAX}`,
      })
    }
  })

export type RegisterFormData = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Please enter your current password'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export const updateProfileSchema = z.object({
  email: z.string().email('Please enter a valid email address').optional(),
  phone: z.string().optional(),
})

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
