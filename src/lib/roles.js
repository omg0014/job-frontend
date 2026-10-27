/**
 * Mirrors backend/src/utils/roles.js. The server is the authority — these are
 * for showing and hiding UI, never for access control.
 */
export const ROLES = {
  ADMIN: 'admin',
  PRINCIPAL: 'principal',
  RECRUITER: 'recruiter',
  CANDIDATE: 'candidate',
};

export const STAFF_ROLES = [ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.RECRUITER];

export const ROLE_RANK = {
  [ROLES.CANDIDATE]: 0,
  [ROLES.RECRUITER]: 1,
  [ROLES.PRINCIPAL]: 2,
  [ROLES.ADMIN]: 3,
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.PRINCIPAL]: 'Principal',
  [ROLES.RECRUITER]: 'Recruiter',
  [ROLES.CANDIDATE]: 'Candidate',
};

export const ROLE_BADGES = {
  [ROLES.ADMIN]: 'bg-purple-50 text-purple-800 ring-purple-200',
  [ROLES.PRINCIPAL]: 'bg-blue-50 text-blue-700 ring-blue-200',
  [ROLES.RECRUITER]: 'bg-teal-50 text-teal-700 ring-teal-200',
  [ROLES.CANDIDATE]: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export const isStaff = (role) => STAFF_ROLES.includes(role);
export const atLeast = (role, minimum) =>
  (ROLE_RANK[role] ?? -1) >= (ROLE_RANK[minimum] ?? Infinity);

/** Who this role may appoint — drives whether the "Appoint" button shows. */
export const appointableBy = (role) => {
  // An admin can appoint a peer admin, so a school always has a second person
  // who can get in. The server enforces this list; here it only shapes the form.
  if (role === ROLES.ADMIN) return [ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.RECRUITER];
  if (role === ROLES.PRINCIPAL) return [ROLES.RECRUITER];
  return [];
};

/** What each role's activity view is called, from their point of view. */
export const activityScopeLabel = (role) => {
  if (role === ROLES.ADMIN) return 'All staff activity';
  if (role === ROLES.PRINCIPAL) return 'My team’s activity';
  return 'My activity';
};

export const ACTIVITY_CATEGORY_LABELS = {
  job: 'Jobs',
  applicant: 'Applicants',
  account: 'Accounts',
  auth: 'Sign-ins',
};
