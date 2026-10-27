import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Download, Upload, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Card, Button, ButtonLink, PageHeader, EmptyState, ErrorState } from '../../components/ui.jsx';
import { ProfileForm } from '../../components/ProfileForm.jsx';
import { FullPageSpinner, Spinner } from '../../components/Loading.jsx';
import { useFileBlob, downloadFile } from '../../hooks/useFileBlob.js';
import { formatDate, formatBytes } from '../../lib/format.js';

/** Inline CV preview fed by a blob URL — a POST endpoint cannot back an iframe. */
const CvPreview = ({ onClose }) => {
  const { url, loading, error, mimeType } = useFileBlob(endpoints.profile.downloadCv, {});

  // Escape closes it, like every other overlay in the app.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fade-in fixed inset-0 z-40 flex items-center justify-center bg-plum-900/45 p-3 sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Your CV"
        className="flex h-full max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-card bg-field shadow-modal"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-ui font-semibold text-ink">Your CV</h2>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="rounded-control p-2 text-ink-soft transition-colors duration-micro hover:bg-paper hover:text-ink"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 bg-paper">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner className="h-6 w-6 text-plum-600" />
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState message={error} />
            </div>
          ) : mimeType?.includes('pdf') ? (
            <iframe src={url} title="CV preview" className="h-full w-full border-0" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <FileText className="h-8 w-8 text-ink-soft/70" aria-hidden="true" />
              <p className="text-ui text-ink-soft">
                Word documents cannot be previewed in the browser.
              </p>
              <a
                href={url}
                download
                className="inline-flex h-8 items-center rounded-control border border-line bg-field px-3 text-meta font-semibold text-ink transition-colors duration-micro hover:border-plum-200 hover:bg-plum-50 hover:text-plum-800"
              >
                Download to view
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: () => request(endpoints.profile.get),
  });

  const save = useMutation({
    mutationFn: (values) => request(endpoints.profile.update, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
    },
    // Field-level problems are shown on the form itself, which scrolls to
    // the first one; only failures with nothing to point at toast here.
    onError: (mutationError) => {
      if (!mutationError.details?.errors?.length) toast.error(mutationError.message);
    },
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadFile(endpoints.profile.downloadCv, {}, 'my-cv.pdf');
    } catch (downloadError) {
      toast.error(downloadError.message);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return <FullPageSpinner />;
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;

  const profile = data.profile;
  const cv = profile.cv;

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
        title="My profile"
        description="This is what we send to the hiring team with every application."
      />

      <Card className="mb-8 divide-y divide-line sm:mb-12">
        <div className="p-5 sm:p-7">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-serif text-heading font-semibold text-ink">Profile completion</h2>
              <p className="mt-0.5 text-ui text-ink-soft">
                {profile.profileCompletion >= 60
                  ? 'You can apply to any open role.'
                  : 'A profile of at least 60% is needed to apply.'}
              </p>
            </div>
            <span data-stat className="tabular text-display text-plum-600">
              {profile.profileCompletion}%
            </span>
          </div>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuenow={profile.profileCompletion}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completion"
          >
            <div
              className="h-full w-full origin-left rounded-full bg-plum-600 transition-transform duration-panel ease-out-soft"
              style={{ transform: `scaleX(${profile.profileCompletion / 100})` }}
            />
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <h2 className="mb-4 font-serif text-heading font-semibold text-ink">Your CV</h2>

          {cv?.originalName ? (
            <>
              <div className="flex flex-col gap-3 rounded-control border border-line bg-field p-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-plum-50">
                    <FileText className="h-5 w-5 text-plum-600" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ui font-semibold text-ink">{cv.originalName}</p>
                    <p className="text-meta text-ink-soft">
                      {formatBytes(cv.size)} · uploaded {formatDate(cv.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button variant="secondary" size="sm" onClick={() => setPreviewOpen(true)}>
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    {downloading ? <Spinner className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" aria-hidden="true" />}
                    Download
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                <ButtonLink to="/profile/upload-cv" variant="ghost" size="sm" className="-ml-3">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  Replace CV
                </ButtonLink>
                <p className="text-meta text-ink-soft">
                  A new CV takes you back to the review step. Your saved details stay as they
                  are until you confirm the new ones.
                </p>
              </div>
            </>
          ) : (
            <EmptyState
              icon={FileText}
              title="No CV uploaded"
              description="Upload your CV so it can be sent with your applications."
              action={
                <ButtonLink to="/profile/upload-cv" size="sm">
                  Upload CV
                </ButtonLink>
              }
            />
          )}
        </div>
      </Card>

      <ProfileForm
        defaultValues={defaultValues}
        onSubmit={(values) => save.mutateAsync(values)}
        isSubmitting={save.isPending}
        submitLabel="Save changes"
        footerNote="Changes apply to future applications, not ones already submitted."
      />

      {previewOpen ? <CvPreview onClose={() => setPreviewOpen(false)} /> : null}
    </div>
  );
};
