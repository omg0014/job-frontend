import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, TextLink } from '../../components/ui.jsx';
import { AuthShell } from './AuthShell.jsx';
import { Field, Input } from '../../components/form.jsx';
import { Spinner } from '../../components/Loading.jsx';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      // Return them where they were headed before the guard intervened.
      const fallback = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(location.state?.from ?? fallback, { replace: true });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      description="Welcome back. Pick up where you left off."
      panelTitle="Good to see you again"
      points={[
        'See where each of your applications stands.',
        'Apply to new roles in a single click.',
        'Keep your profile and CV up to date.',
      ]}
      footer={
        <>
          New here?{' '}
          <TextLink to="/register">Create a candidate account</TextLink>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email}
            {...register('email')}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message} required>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password}
            {...register('password')}
          />
        </Field>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : null}
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
};
