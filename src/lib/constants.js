/**
 * Status badge colours. Semantic and consistent everywhere a status appears.
 */
/**
 * The pipeline is a progression, not six categories, so the teal deepens as a
 * candidate advances — legible across a whole list at a glance. Green and red
 * terminate the flow. The colour is always paired with its text label; colour
 * alone never carries the meaning.
 */
export const APPLICATION_STATUS = {
  applied: {
    label: 'Applied',
    className: 'bg-status-applied text-status-applied-ink',
    dot: 'bg-status-applied-ink',
  },
  under_review: {
    label: 'Under review',
    className: 'bg-status-review text-status-review-ink',
    dot: 'bg-status-review-ink',
  },
  screening: {
    label: 'Video screening',
    className: 'bg-status-screening text-status-screening-ink',
    dot: 'bg-status-screening-ink',
  },
  shortlisted: {
    label: 'Shortlisted',
    className: 'bg-status-short text-status-short-ink',
    dot: 'bg-status-short-ink',
  },
  interview_scheduled: {
    label: 'Interview scheduled',
    className: 'bg-status-interview text-status-interview-ink',
    dot: 'bg-status-interview-ink',
  },
  selected: {
    label: 'Selected',
    className: 'bg-status-selected text-status-selected-ink',
    dot: 'bg-status-selected-ink',
  },
  rejected: {
    label: 'Not selected',
    className: 'bg-status-rejected text-status-rejected-ink',
    dot: 'bg-status-rejected-ink',
  },
};

/** The pipeline as a stepper — rejection is a branch, not a step. */
export const PIPELINE_STEPS = [
  'applied',
  'under_review',
  'screening',
  'shortlisted',
  'interview_scheduled',
  'selected',
];

export const JOB_STATUS = {
  open: { label: 'Open', className: 'bg-status-selected text-status-selected-ink' },
  closed: { label: 'Closed', className: 'bg-status-applied text-status-applied-ink' },
  draft: { label: 'Draft', className: 'bg-plum-50 text-plum-800' },
};

export const EMPLOYMENT_TYPE_LABELS = {
  full_time: 'Full time',
  part_time: 'Part time',
  contract: 'Contract',
  temporary: 'Temporary',
};

export const INTERVIEW_OUTCOME = {
  pending: { label: 'Pending', className: 'bg-status-applied text-status-applied-ink' },
  passed: { label: 'Passed', className: 'bg-status-selected text-status-selected-ink' },
  failed: { label: 'Did not pass', className: 'bg-status-rejected text-status-rejected-ink' },
};

export const MAX_CV_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_CV_TYPES = '.pdf,.doc,.docx';
