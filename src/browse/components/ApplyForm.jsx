import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Input, Textarea } from '../ui/Input.jsx';
import { cn } from '../lib/cn.js';

const applySchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name').max(80),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[-\s]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  currentCtc: z
    .string()
    .trim()
    .regex(/^\d{1,3}(\.\d{1,2})?$/, 'Enter your CTC in lakhs, e.g. 18 or 18.5'),
  noticePeriod: z.string().trim().min(1, 'Select a notice period'),
  note: z.string().trim().max(600, 'Keep this under 600 characters').optional(),
});

const Field = ({ label, htmlFor, error, hint, required, children }) => (
  <div>
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink-800">
      {label}
      {required ? <span className="ml-0.5 text-red-600" aria-hidden="true">*</span> : null}
    </label>
    {children}
    {error ? (
      <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-[12px] text-red-600">
        {error}
      </p>
    ) : hint ? (
      <p className="mt-1.5 text-[12px] text-ink-500">{hint}</p>
    ) : null}
  </div>
);

const NOTICE_OPTIONS = ['Immediate', '15 days', '30 days', '60 days', '90 days'];

export const ApplyForm = ({ job, onSubmitted, submitted }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(applySchema),
    defaultValues: { noticePeriod: '30 days' },
  });

  const onSubmit = async () => {
    // Stand-in for the network call this screen would make.
    await new Promise((resolve) => setTimeout(resolve, 900));
    onSubmitted();
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-card border border-emerald-200 bg-emerald-50/60 p-5 text-center"
        role="status"
      >
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-5 w-5 text-emerald-700" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <h4 className="mt-3 text-sm font-semibold tracking-heading text-ink-900">
          Application sent to {job.company}
        </h4>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
          You will hear back through the email you provided. Most teams respond within a week.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Ananya Rao"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            className={cn(errors.fullName && 'border-red-400')}
            {...register('fullName')}
          />
        </Field>

        <Field label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={cn(errors.email && 'border-red-400')}
            {...register('email')}
          />
        </Field>

        <Field label="Phone" htmlFor="phone" required error={errors.phone?.message}>
          <Input
            id="phone"
            inputMode="tel"
            autoComplete="tel"
            placeholder="9876543210"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            className={cn(errors.phone && 'border-red-400')}
            {...register('phone')}
          />
        </Field>

        <Field
          label="Current CTC"
          htmlFor="currentCtc"
          required
          error={errors.currentCtc?.message}
          hint="In lakhs per annum"
        >
          <Input
            id="currentCtc"
            inputMode="decimal"
            placeholder="18"
            aria-invalid={Boolean(errors.currentCtc)}
            aria-describedby={errors.currentCtc ? 'currentCtc-error' : undefined}
            className={cn(errors.currentCtc && 'border-red-400')}
            {...register('currentCtc')}
          />
        </Field>
      </div>

      <Field label="Notice period" htmlFor="noticePeriod" required error={errors.noticePeriod?.message}>
        <select
          id="noticePeriod"
          className={cn(
            'h-9 w-full rounded-control border border-ink-200 bg-surface px-3 text-sm text-ink-900',
            'transition-[border-color,box-shadow] duration-150 ease-out hover:border-ink-300',
            'focus:outline-none focus-visible:border-purple-700 focus-visible:ring-2 focus-visible:ring-purple-700/20',
          )}
          {...register('noticePeriod')}
        >
          {NOTICE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Anything you want the team to know"
        htmlFor="note"
        error={errors.note?.message}
        hint="Optional — a short note on why this role fits."
      >
        <Textarea id="note" rows={3} placeholder="I led the payments rewrite at…" {...register('note')} />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" size="lg" loading={isSubmitting} className="flex-1 sm:flex-none">
          {isSubmitting ? 'Sending…' : `Apply to ${job.company}`}
        </Button>
        <p className="text-[12px] text-ink-500">Your saved profile and CV are attached.</p>
      </div>
    </form>
  );
};
