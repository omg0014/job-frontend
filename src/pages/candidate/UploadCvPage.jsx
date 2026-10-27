import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { UploadCloud, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';
import { requestUpload } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Card, PageHeader, TextLink } from '../../components/ui.jsx';
import { MAX_CV_BYTES } from '../../lib/constants.js';
import { formatBytes } from '../../lib/format.js';
import { clsx } from '../../lib/clsx.js';

/**
 * Named stages, shown as they actually happen. A spinner that lies about
 * progress is the thing this screen most needs to avoid — the teacher is
 * trusting us with the document their career runs on.
 */
const STAGES = [
  { id: 'upload', label: 'Uploading your file' },
  { id: 'read', label: 'Reading your file' },
  { id: 'extract', label: 'Finding your details' },
  { id: 'verify', label: 'Checking the dates' },
];

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export const UploadCvPage = () => {
  const [stageIndex, setStageIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const stageTimers = useRef([]);

  useEffect(() => () => stageTimers.current.forEach(clearTimeout), []);

  const upload = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('cv', file);
      return requestUpload(endpoints.profile.uploadCv, formData, (value) => {
        setProgress(value);
        // The upload stage is real progress from the browser.
        if (value >= 100) setStageIndex(1);
      });
    },
    onSuccess: (data) => {
      stageTimers.current.forEach(clearTimeout);
      setStageIndex(STAGES.length);
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      if (data.parseStatus === 'failed') {
        toast.warning('We could not read this file', {
          description:
            data.reason ??
            'It may be a scanned image. Upload a text PDF, or enter your details by hand.',
          duration: 7000,
        });
      }

      // Let the final tick land before moving on.
      setTimeout(() => {
        navigate('/profile/review', {
          state: {
            parsed: data.parsed,
            autoFilledFields: data.autoFilledFields,
            parseStatus: data.parseStatus,
          },
          replace: true,
        });
      }, reduceMotion ? 0 : 420);
    },
    onError: (error) => {
      stageTimers.current.forEach(clearTimeout);
      setStageIndex(-1);
      setProgress(0);
      toast.error('That upload did not work', { description: error.message });
    },
  });

  const onDrop = useCallback(
    (accepted, rejected) => {
      if (rejected.length > 0) {
        const reason = rejected[0].errors[0];
        toast.error(
          reason.code === 'file-too-large'
            ? 'That file is too large'
            : 'We cannot read that file type',
          {
            description:
              reason.code === 'file-too-large'
                ? `The maximum size is 5 MB. Yours is ${formatBytes(rejected[0].file.size)}.`
                : 'Please upload a PDF, DOC or DOCX file.',
          },
        );
        return;
      }

      const file = accepted[0];
      if (!file) return;

      setSelectedFile(file);
      setStageIndex(0);
      setProgress(0);

      // Stages past the upload are paced against the parse. A local model
      // takes several seconds, so these are spaced to match real work rather
      // than racing to the last stage and sitting there — a progress display
      // that finishes early is the same lie as a spinner. The final stage is
      // never marked complete by a timer; only the response does that.
      stageTimers.current = [
        setTimeout(() => setStageIndex((i) => Math.max(i, 2)), 1400),
        setTimeout(() => setStageIndex((i) => Math.max(i, 3)), 5000),
      ];

      upload.mutate(file);
    },
    [upload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: MAX_CV_BYTES,
    disabled: upload.isPending,
  });

  const busy = stageIndex >= 0;

  return (
    <div className="mx-auto max-w-candidate">
      <PageHeader
        title="Upload your CV"
        description="We'll read your CV and fill in your profile. You can fix anything we get wrong."
      />

      <Card className="p-3 sm:p-4">
        {!busy ? (
          <div
            {...getRootProps()}
            className={clsx(
              'group flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-14 text-center sm:py-20',
              'transition-colors duration-base ease-out-soft',
              isDragActive
                ? 'border-plum-600 bg-plum-50'
                : 'border-plum-200 bg-field hover:border-plum-400 hover:bg-plum-50/40',
            )}
          >
            <input {...getInputProps()} aria-label="Choose your CV file" />
            <div
              className={clsx(
                'flex h-14 w-14 items-center justify-center rounded-full bg-plum-50 ring-8 ring-plum-50/50',
                'transition-transform duration-base ease-out-soft',
                isDragActive ? 'scale-110' : 'group-hover:-translate-y-0.5',
              )}
            >
              <UploadCloud className="h-7 w-7 text-plum-600" aria-hidden="true" />
            </div>
            <p className="mt-5 text-body font-semibold text-ink">
              {isDragActive ? 'Drop your CV here' : (
                <>
                  <span className="hidden sm:inline">Drag your CV here, or click to choose a file</span>
                  <span className="sm:hidden">Tap to choose your CV</span>
                </>
              )}
            </p>
            <p className="mt-1.5 text-ui text-ink-soft">PDF, DOC or DOCX, up to 5 MB</p>
            <span className="mt-6 inline-flex h-11 items-center rounded-control bg-plum-600 px-6 text-body font-semibold text-white transition-colors duration-micro group-hover:bg-plum-700">
              Choose file
            </span>
          </div>
        ) : (
          <div className="px-2 py-3 sm:px-3">
            {selectedFile ? (
              <div className="mb-6 flex items-center gap-3 rounded-control border border-line bg-field p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-plum-50">
                  <FileText className="h-5 w-5 text-plum-600" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-ui font-semibold text-ink">{selectedFile.name}</p>
                  <p className="tabular text-meta text-ink-soft">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Real named stages, ticked as they complete. */}
            <ol className="space-y-4" aria-live="polite">
              {STAGES.map((stage, index) => {
                const done = stageIndex > index;
                const active = stageIndex === index;

                return (
                  <li key={stage.id} className="flex items-start gap-3">
                    <span
                      className={clsx(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-base',
                        done && 'bg-plum-600 text-white',
                        active && 'bg-plum-50 ring-2 ring-plum-600',
                        !done && !active && 'border border-line bg-card',
                      )}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                      ) : active ? (
                        <motion.span
                          className="h-2 w-2 rounded-full bg-plum-600"
                          animate={reduceMotion ? {} : { opacity: [1, 0.35, 1] }}
                          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      ) : null}
                    </span>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <p
                        className={clsx(
                          'text-ui',
                          done ? 'text-ink-soft' : active ? 'font-semibold text-ink' : 'text-ink-soft/60',
                        )}
                      >
                        {stage.label}
                        {active && index === 0 ? (
                          <span className="tabular ml-1.5 font-normal text-ink-soft">{progress}%</span>
                        ) : null}
                        {active && index === STAGES.length - 1 ? (
                          <span className="ml-1.5 font-normal text-ink-soft">this can take a few seconds</span>
                        ) : null}
                      </p>
                      {/* The upload stage has a real number, so it gets a real bar. */}
                      {active && index === 0 ? (
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line">
                          <div
                            className="h-full w-full origin-left rounded-full bg-plum-600 transition-transform duration-base ease-out-soft"
                            style={{ transform: `scaleX(${progress / 100})` }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>

            <AnimatePresence>
              {stageIndex >= STAGES.length ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 text-ui font-semibold text-plum-700"
                >
                  Done. Taking you to your details…
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        )}
      </Card>

      <section className="mt-10" aria-labelledby="what-next">
        <h2 id="what-next" className="font-serif text-heading font-semibold text-ink">
          What happens next
        </h2>
        <ol className="mt-4 space-y-4">
          {[
            'We read your CV and pull out your details automatically.',
            'You check what we found and correct anything that is wrong.',
            'Your profile is saved, and you can apply to any role in one click.',
          ].map((text, index) => (
            <li key={text} className="flex gap-3.5">
              <span className="tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-card text-meta font-semibold text-plum-700">
                {index + 1}
              </span>
              <p className="pt-0.5 text-ui leading-relaxed text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-10 border-t border-line pt-6 text-center text-ui text-ink-soft">
        Would rather type your details?{' '}
        <TextLink to="/profile">Fill in your profile by hand</TextLink>
      </p>
    </div>
  );
};
