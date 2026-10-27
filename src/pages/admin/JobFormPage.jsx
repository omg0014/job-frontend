import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Card, Button, ButtonLink, BackLink, PageHeader, ErrorState } from '../../components/ui.jsx';
import { Field, Input, Textarea, Select, ChipInput } from '../../components/form.jsx';
import { FullPageSpinner, Spinner } from '../../components/Loading.jsx';
import { useTaxonomy } from '../../hooks/useTaxonomy.js';
import { toDateInput } from '../../lib/format.js';
import { EMPLOYMENT_TYPE_LABELS } from '../../lib/constants.js';

const schema = z
  .object({
    title: z.string().trim().min(3, 'Title is required').max(140),
    department: z.string().trim().min(2, 'Department is required'),
    location: z.string().trim().min(2, 'Location is required'),
    employmentType: z.enum(['full_time', 'part_time', 'contract', 'temporary']),
    experienceMin: z.coerce.number().min(0, 'Cannot be negative').max(60),
    experienceMax: z.coerce.number().min(0, 'Cannot be negative').max(60),
    qualification: z.string().trim().max(200).default(''),
    skills: z.array(z.string()).default([]),
    subjects: z.array(z.string()).default([]),
    description: z.string().trim().min(10, 'Please describe the role').max(20000),
    openings: z.coerce.number().int().min(1, 'At least one opening').max(500),
    lastDateToApply: z.string().min(1, 'Set a closing date'),
    status: z.enum(['open', 'closed', 'draft']),
  })
  .refine((data) => data.experienceMax >= data.experienceMin, {
    message: 'Maximum must be at least the minimum',
    path: ['experienceMax'],
  });

const blankJob = {
  title: '',
  department: '',
  location: 'Coimbatore, Tamil Nadu',
  employmentType: 'full_time',
  experienceMin: 0,
  experienceMax: 5,
  qualification: '',
  skills: [],
  subjects: [],
  description: '',
  openings: 1,
  lastDateToApply: '',
  status: 'open',
};

/**
 * A form block: its title and a line of context on the left at desktop
 * widths, the fields on the right. On a phone the two stack.
 */
const FormSection = ({ title, description, children }) => (
  <Card className="grid gap-x-8 gap-y-4 p-5 sm:p-6 lg:grid-cols-[200px_minmax(0,1fr)]">
    <div>
      <h2 className="font-serif text-body font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-1 text-meta text-ink-soft">{description}</p> : null}
    </div>
    <div className="min-w-0">{children}</div>
  </Card>
);

export const JobFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: taxonomy } = useTaxonomy();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['job', id],
    queryFn: () => request(endpoints.jobs.get, { jobId: id }),
    enabled: isEdit,
  });

  const job = data?.job;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    values: job
      ? {
          title: job.title,
          department: job.department,
          location: job.location,
          employmentType: job.employmentType,
          experienceMin: job.experienceMin,
          experienceMax: job.experienceMax,
          qualification: job.qualification ?? '',
          skills: job.skills ?? [],
          subjects: job.subjects ?? [],
          description: job.description ?? '',
          openings: job.openings,
          lastDateToApply: toDateInput(job.lastDateToApply),
          status: job.status,
        }
      : blankJob,
  });

  const save = useMutation({
    mutationFn: (values) =>
      isEdit
        ? request(endpoints.jobs.update, { jobId: id, ...values })
        : request(endpoints.jobs.create, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['job', id] });
      toast.success(isEdit ? 'Job updated' : 'Job posted');
      navigate('/admin/jobs');
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  if (isEdit && isLoading) return <FullPageSpinner />;
  if (isEdit && isError) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        dense
        back={<BackLink to="/admin/jobs">Back to jobs</BackLink>}
        title={isEdit ? 'Edit job' : 'Post a job'}
        description={
          isEdit
            ? 'Changes appear on the careers site immediately.'
            : 'This opening will be visible to candidates once its status is Open.'
        }
      />

      <form onSubmit={handleSubmit((values) => save.mutate(values))} className="space-y-4" noValidate>
        <FormSection title="Role" description="What the job is, where, and who it suits.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Job title" htmlFor="title" required error={errors.title?.message}>
                <Input
                  id="title"
                  placeholder="PGT Physics"
                  error={errors.title}
                  {...register('title')}
                />
              </Field>
            </div>

            <Field
              label="Department"
              htmlFor="department"
              required
              error={errors.department?.message}
            >
              <Input
                id="department"
                list="department-options"
                placeholder="Senior Secondary"
                error={errors.department}
                {...register('department')}
              />
              <datalist id="department-options">
                {(taxonomy?.departments ?? []).map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </Field>

            <Field label="Location" htmlFor="location" required error={errors.location?.message}>
              <Input id="location" error={errors.location} {...register('location')} />
            </Field>

            <Field label="Employment type" htmlFor="employmentType">
              <Select id="employmentType" {...register('employmentType')}>
                {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Number of openings"
              htmlFor="openings"
              required
              error={errors.openings?.message}
            >
              <Input
                id="openings"
                type="number"
                min="1"
                error={errors.openings}
                {...register('openings')}
              />
            </Field>

            <Field
              label="Minimum experience (years)"
              htmlFor="experienceMin"
              error={errors.experienceMin?.message}
            >
              <Input
                id="experienceMin"
                type="number"
                min="0"
                error={errors.experienceMin}
                {...register('experienceMin')}
              />
            </Field>

            <Field
              label="Maximum experience (years)"
              htmlFor="experienceMax"
              error={errors.experienceMax?.message}
            >
              <Input
                id="experienceMax"
                type="number"
                min="0"
                error={errors.experienceMax}
                {...register('experienceMax')}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field
                label="Qualification required"
                htmlFor="qualification"
                error={errors.qualification?.message}
              >
                <Input
                  id="qualification"
                  placeholder="M.Sc. Physics with B.Ed"
                  {...register('qualification')}
                />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Subjects & skills" description="Used to match the opening to candidates’ profiles.">
          <div className="space-y-4">
            <Field label="Subjects">
              <Controller
                control={control}
                name="subjects"
                render={({ field }) => (
                  <ChipInput
                    value={field.value ?? []}
                    onChange={field.onChange}
                    suggestions={taxonomy?.subjects ?? []}
                    placeholder="Physics, Mathematics…"
                  />
                )}
              />
            </Field>

            <Field label="Skills">
              <Controller
                control={control}
                name="skills"
                render={({ field }) => (
                  <ChipInput
                    value={field.value ?? []}
                    onChange={field.onChange}
                    suggestions={taxonomy?.skills ?? []}
                    placeholder="Lesson Planning, Smart Board…"
                  />
                )}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Description" description="What candidates read on the role’s page.">
          <Field
            label="About the role"
            htmlFor="description"
            required
            error={errors.description?.message}
            hint="Responsibilities and requirements. Line breaks are preserved."
          >
            <Textarea
              id="description"
              rows={12}
              error={errors.description}
              placeholder={'Responsibilities\n- …\n\nRequirements\n- …'}
              {...register('description')}
            />
          </Field>
        </FormSection>

        <FormSection title="Publishing" description="When applications close, and who can see it.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Last date to apply"
              htmlFor="lastDateToApply"
              required
              error={errors.lastDateToApply?.message}
            >
              <Input
                id="lastDateToApply"
                type="date"
                error={errors.lastDateToApply}
                {...register('lastDateToApply')}
              />
            </Field>

            <Field
              label="Status"
              htmlFor="status"
              hint="Drafts are not visible to candidates."
            >
              <Select id="status" {...register('status')}>
                <option value="open">Open</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </Select>
            </Field>
          </div>
        </FormSection>

        {/* Pinned to the bottom of the viewport while the form scrolls, so
            saving never needs a trip to the end of a long description. */}
        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap justify-end gap-2 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:px-0">
          <ButtonLink to="/admin/jobs" variant="secondary" size="lg">
            Cancel
          </ButtonLink>
          <Button type="submit" size="lg" disabled={save.isPending}>
            {save.isPending ? <Spinner /> : null}
            {isEdit ? 'Save changes' : 'Post job'}
          </Button>
        </div>
      </form>
    </div>
  );
};
