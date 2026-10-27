import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Info } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Button } from '../../components/ui.jsx';
import { Field, Select, Textarea } from '../../components/form.jsx';
import { Spinner } from '../../components/Loading.jsx';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ConfirmDialog.jsx';

/**
 * Offers a role to a candidate.
 *
 * This sends an invitation, not an application — the candidate still presses
 * Apply, so their profile and CV are attached the normal way and nobody ends
 * up in a pipeline they did not choose to enter.
 */
export const OfferRoleDialog = ({ candidate, onClose }) => {
  const [jobId, setJobId] = useState('');
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  // Only open roles can be offered, so the list is the live job board.
  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs', { page: 1, limit: 50, status: 'open' }],
    queryFn: () => request(endpoints.jobs.list, { page: 1, limit: 50, status: 'open' }),
  });

  const invite = useMutation({
    mutationFn: () => request(endpoints.candidates.invite, { candidateId: candidate.id, jobId, message }),
    onSuccess: (_, __, ___) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success(`Invitation sent to ${candidate.name}`, {
        description: 'They will see it in their notifications and by email.',
      });
      onClose();
    },
    onError: (error) => toast.error('That invitation did not send', { description: error.message }),
  });

  const jobs = (jobsData?.items ?? []).filter((job) => job.status === 'open');
  const selected = jobs.find((job) => job._id === jobId);

  const firstName = candidate.name.split(' ')[0];

  return (
    <Dialog onClose={onClose} labelledBy="offer-title" busy={invite.isPending}>
      <DialogHeader
        id="offer-title"
        title="Offer a role"
        description={
          <span className="block truncate">
            to {candidate.name}
            {candidate.subjects.length > 0 ? ` · ${candidate.subjects.join(', ')}` : ''}
          </span>
        }
        onClose={onClose}
        closeDisabled={invite.isPending}
      />

      <DialogBody className="space-y-5">
        <Field
          label="Which role?"
          htmlFor="offer-job"
          required
          hint={
            selected
              ? `${selected.department} · ${selected.location}`
              : 'Only roles that are currently open can be offered.'
          }
        >
          <Select
            id="offer-job"
            data-autofocus
            value={jobId}
            onChange={(event) => setJobId(event.target.value)}
            disabled={isLoading}
          >
            <option value="">{isLoading ? 'Loading roles…' : 'Choose a role'}</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>
                {job.title} — {job.department}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Add a note"
          htmlFor="offer-message"
          hint="Optional. They will see this above the link to the role."
        >
          <Textarea
            id="offer-message"
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Your laboratory experience looks like a strong fit for this role."
          />
        </Field>

        <p className="flex gap-2.5 rounded-control border border-line bg-card p-3 text-meta leading-relaxed text-ink-soft">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-plum-500" aria-hidden="true" />
          <span>
            This invites {firstName} to apply. They still press Apply themselves, so their
            profile and CV are attached the usual way.
          </span>
        </p>
      </DialogBody>

      <DialogFooter>
        <Button variant="secondary" onClick={onClose} disabled={invite.isPending}>
          Cancel
        </Button>
        <Button onClick={() => invite.mutate()} disabled={!jobId || invite.isPending}>
          {invite.isPending ? <Spinner /> : <Send className="h-4 w-4" aria-hidden="true" />}
          Send invitation
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
