import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { PageHeader } from '../../components/ui.jsx';
import { ProfileForm } from '../../components/ProfileForm.jsx';
import { FullPageSpinner } from '../../components/Loading.jsx';

/**
 * The review step. The parsed draft arrives via router state straight from the
 * upload response; nothing has been saved to the profile yet. Auto-filled
 * fields are badged so the teacher knows exactly what to double-check.
 */
export const ProfileReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const parsed = location.state?.parsed;
  const autoFilledFields = location.state?.autoFilledFields ?? [];
  const parseStatus = location.state?.parseStatus;

  // Falls back to the saved profile if someone lands here directly (a refresh,
  // or a bookmarked URL) — router state does not survive a reload.
  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => request(endpoints.profile.get),
    enabled: !parsed,
  });

  const save = useMutation({
    mutationFn: (values) => request(endpoints.profile.update, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile saved. You can now apply in one click.');
      navigate('/jobs');
    },
    // Field-level problems are shown on the form itself, which scrolls to
    // the first one; only failures with nothing to point at toast here.
    onError: (error) => {
      if (!error.details?.errors?.length) toast.error(error.message);
    },
  });

  if (!parsed && isLoading) return <FullPageSpinner />;

  const profile = parsed ?? data?.profile;
  if (!profile) return <Navigate to="/profile/upload-cv" replace />;

  const defaultValues = {
    fullName: profile.fullName ?? '',
    phone: profile.phone ?? '',
    email: profile.email ?? '',
    location: profile.location ?? '',
    headline: profile.headline ?? '',
    totalExperienceYears: profile.totalExperienceYears ?? 0,
    education: profile.education ?? [],
    experience: profile.experience ?? [],
    subjects: profile.subjects ?? [],
    skills: profile.skills ?? [],
    certifications: profile.certifications ?? [],
    languages: profile.languages ?? [],
    preferredDepartments: profile.preferredDepartments ?? [],
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Check your details"
        description="We read these from your CV. Correct anything we got wrong, then save."
      />

      {parseStatus === 'failed' ? (
        <div className="mb-8 flex items-start gap-3 rounded-card border border-line/80 bg-field shadow-card p-4 sm:p-5">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-gold-700"
            aria-hidden="true"
          />
          <div>
            <p className="text-ui font-semibold text-ink">We could not read this file</p>
            <p className="mt-1 max-w-measure text-ui leading-relaxed text-ink-soft">
              It may be a scanned image rather than a text document. Your file is saved and
              will still be sent with your applications — please fill in your details below.
            </p>
          </div>
        </div>
      ) : autoFilledFields.length > 0 ? (
        <div className="mb-8 rounded-card border border-line/80 bg-field shadow-card p-4 sm:p-5">
          <p className="text-ui font-semibold text-ink">
            We filled in {autoFilledFields.length} field
            {autoFilledFields.length === 1 ? '' : 's'} from your CV
          </p>
          <p className="mt-1 max-w-measure text-ui leading-relaxed text-ink-soft">
            Anything marked{' '}
            <span className="inline-flex items-center rounded-full border border-gold-500/60 bg-gold-50 px-1.5 py-px text-[11px] font-semibold text-gold-700">
              from your CV
            </span>{' '}
            came from your document. Automatic reading is not perfect, so please check those
            before you save.
          </p>
        </div>
      ) : null}

      <ProfileForm
        defaultValues={defaultValues}
        autoFilledFields={autoFilledFields}
        onSubmit={(values) => save.mutateAsync(values)}
        isSubmitting={save.isPending}
        submitLabel="Save and continue"
        footerNote="You can edit any of this later from your profile."
        stagger={Boolean(parsed)}
      />
    </div>
  );
};
