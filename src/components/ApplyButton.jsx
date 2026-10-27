import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { request } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';
import { Button } from './ui.jsx';
import { Spinner } from './Loading.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const MIN_COMPLETION = 60;

/**
 * One-click apply. The profile and CV are already on file, so this sends only
 * the job id. The button disables while in flight and becomes a permanent
 * "Applied" state afterwards — a duplicate application can never fire.
 */
export const ApplyButton = ({ jobId, hasApplied, canApply, size = 'lg', className = '' }) => {
  const { user, isCandidate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Only fetched for a signed-in candidate, to check readiness before applying.
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => request(endpoints.profile.get),
    enabled: isCandidate,
    staleTime: 30000,
  });

  const reduceMotion = useReducedMotion();

  const apply = useMutation({
    mutationFn: () => request(endpoints.applications.create, { jobId }),
    onSuccess: () => {
      toast.success('Applied', {
        description: 'Your profile and CV have been sent to the school.',
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      // A 409 means the application already exists — treat it as success, not
      // an error, and refresh so the button settles into "Applied".
      if (error.status === 409) {
        toast('You have already applied to this job');
        queryClient.invalidateQueries({ queryKey: ['job', jobId] });
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        return;
      }
      toast.error(error.message);
    },
  });

  if (hasApplied || apply.isSuccess) {
    return (
      <Button
        variant="secondary"
        size={size}
        className={`${className} ${apply.isSuccess ? 'min-w-[11rem]' : ''}`}
        disabled
      >
        {/* Just applied: the check settles in where the label was, over one
            panel beat. Already-applied on load shows it still. */}
        <motion.span
          initial={apply.isSuccess && !reduceMotion ? { opacity: 0, scale: 0.6 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          className="inline-flex"
        >
          <Check className="h-4 w-4 text-status-selected-ink" strokeWidth={3} aria-hidden="true" />
        </motion.span>
        <span className="text-status-selected-ink">Applied</span>
      </Button>
    );
  }

  if (!canApply) {
    return (
      <Button variant="secondary" size={size} className={className} disabled>
        Applications closed
      </Button>
    );
  }

  if (!user) {
    return (
      <Button
        size={size}
        className={className}
        // Returning to the current path preserves whichever form of the link
        // the visitor arrived on — slug or id.
        onClick={() =>
          navigate('/login', { state: { from: `${location.pathname}${location.search}` } })
        }
      >
        Sign in to apply
      </Button>
    );
  }

  if (!isCandidate) return null;

  const profile = profileData?.profile;
  const needsCv = profile && !profile.cv?.storagePath;
  const needsCompletion = profile && profile.profileCompletion < MIN_COMPLETION;

  const handleClick = () => {
    // An incomplete profile is redirected to the step that fixes it, with a
    // clear reason — never a bare rejection.
    if (needsCv) {
      toast('Please upload your CV first');
      navigate('/profile/upload-cv');
      return;
    }
    if (needsCompletion) {
      toast(`Please complete your profile (currently ${profile.profileCompletion}%)`);
      navigate('/profile');
      return;
    }
    apply.mutate();
  };

  return (
    <Button
      size={size}
      // The width locks so the label can cross-fade without the button
      // resizing under the pointer.
      className={`${className} min-w-[11rem]`}
      onClick={handleClick}
      disabled={apply.isPending}
    >
      <AnimatePresence mode="wait" initial={false}>
        {apply.isPending ? (
          <motion.span
            key="pending"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="inline-flex items-center gap-2"
          >
            <Spinner />
            Applying
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            Apply for this role
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
};
