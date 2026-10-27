/**
 * Every endpoint in one place. All are POST; parameters always travel in the
 * request body.
 */
export const endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    me: '/auth/me',
    logout: '/auth/logout',
  },
  profile: {
    uploadCv: '/profile/upload-cv',
    get: '/profile/get',
    update: '/profile/update',
    downloadCv: '/profile/download-cv',
  },
  jobs: {
    list: '/jobs/list',
    get: '/jobs/get',
    create: '/jobs/create',
    update: '/jobs/update',
    updateStatus: '/jobs/update-status',
    delete: '/jobs/delete',
  },
  applications: {
    create: '/applications/create',
    myList: '/applications/my-list',
    list: '/applications/list',
    get: '/applications/get',
    updateStatus: '/applications/update-status',
    downloadCv: '/applications/download-cv',
  },
  interviews: {
    create: '/interviews/create',
    update: '/interviews/update',
    list: '/interviews/list',
  },
  talentPool: {
    list: '/talent-pool/list',
    add: '/talent-pool/add',
    remove: '/talent-pool/remove',
  },
  // Module 2 — video screening round. Routes land as the build order reaches
  // them; invite and get are step 1.
  screening: {
    invite: '/screening/invite',
    get: '/screening/get',
    acceptConsent: '/screening/accept-consent',
    saveTextAnswers: '/screening/save-text-answers',
    deviceCheck: '/screening/device-check',
    start: '/screening/start',
    uploadChunk: '/screening/upload-chunk',
    finishAnswer: '/screening/finish-answer',
    submit: '/screening/submit',
    playbackUrl: '/screening/playback-url',
    review: '/screening/review',
    saveReview: '/screening/save-review',
    compare: '/screening/compare',
    deleteRecordings: '/screening/delete-recordings',
    templateGet: '/screening/template/get',
    templateUpdate: '/screening/template/update',
  },

  notifications: {
    list: '/notifications/list',
    markRead: '/notifications/mark-read',
  },
  admin: {
    dashboard: '/admin/dashboard',
  },
  candidates: {
    list: '/candidates/list',
    invite: '/candidates/invite',
  },
  team: {
    appoint: '/team/appoint',
    list: '/team/list',
    get: '/team/get',
    setActive: '/team/set-active',
    activity: '/team/activity',
  },
  meta: {
    taxonomy: '/meta/taxonomy',
  },
};
