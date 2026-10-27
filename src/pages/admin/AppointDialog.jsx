import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Button } from '../../components/ui.jsx';
import { Field, Input, Select } from '../../components/form.jsx';
import { Spinner } from '../../components/Loading.jsx';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ConfirmDialog.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES, ROLE_LABELS, appointableBy } from '../../lib/roles.js';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter their full name').max(80),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .regex(/[A-Za-z]/, 'Include a letter')
    .regex(/\d/, 'Include a number'),
  role: z.enum([ROLES.PRINCIPAL, ROLES.RECRUITER]),
  department: z.string().trim().max(80).optional(),
});

/**
 * Appointing creates the account outright — there is no invitation flow in V1,
 * so the appointer sets an initial password and passes it on.
 */
export const AppointDialog = ({ onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const allowedRoles = appointableBy(user?.role);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    // Defaults to the least-privileged role on the list, so granting more
    // access is always a deliberate choice.
    defaultValues: { role: allowedRoles[allowedRoles.length - 1] ?? ROLES.RECRUITER },
  });

  // Drives the explanatory hint, so the appointer sees what they are granting.
  const selectedRole = watch('role');

  const appoint = useMutation({
    mutationFn: (values) => request(endpoints.team.appoint, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      toast.success(`${data.user.name} appointed as ${data.user.roleLabel}`);
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  // handleSubmit resolves as soon as mutate() is called, so the request's own
  // pending state is what keeps the form locked while it is in flight.
  const busy = isSubmitting || appoint.isPending;

  return (
    <Dialog onClose={onClose} labelledBy="appoint-title" busy={busy}>
      <DialogHeader
        id="appoint-title"
        title="Appoint a staff member"
        description="Creates their account straight away."
        onClose={onClose}
        closeDisabled={busy}
      />

      <form
        onSubmit={handleSubmit((values) => appoint.mutate(values))}
        className="flex min-h-0 flex-1 flex-col"
        noValidate
      >
        <DialogBody className="space-y-5">
          <Field
            label="Role"
            htmlFor="role"
            required
            error={errors.role?.message}
            hint={
              selectedRole === ROLES.ADMIN
                ? 'An administrator can see and manage everything, including appointing other administrators.'
                : selectedRole === ROLES.PRINCIPAL
                  ? 'A principal can post jobs, appoint recruiters, and see their activity.'
                  : 'A recruiter can post jobs and manage applicants for the jobs they post.'
            }
          >
            <Select id="role" data-autofocus {...register('role')}>
              {allowedRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" required error={errors.name?.message}>
              <Input id="name" placeholder="Latha Raman" error={errors.name} {...register('name')} />
            </Field>

            <Field label="Department" htmlFor="department" hint="Optional.">
              <Input id="department" placeholder="Senior Secondary" {...register('department')} />
            </Field>
          </div>

          <Field label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="off"
              placeholder="name@yugam.edu.in"
              error={errors.email}
              {...register('email')}
            />
          </Field>

          <Field
            label="Initial password"
            htmlFor="password"
            required
            error={errors.password?.message}
            hint="At least 8 characters with a letter and a number. Share it with them; they can change it later."
          >
            <Input id="password" autoComplete="new-password" error={errors.password} {...register('password')} />
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? <Spinner /> : null}
            Appoint
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};
