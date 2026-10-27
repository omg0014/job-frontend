/**
 * Browse-experience dataset. Company names are plausible Indian tech and
 * product firms; salaries use the LPA convention; titles and stacks match
 * what each company would actually hire for.
 */

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10, 30, 0, 0);
  return date.toISOString();
};

export const ROLE_TYPES = [
  'Full-time',
  'Contract',
  'Internship',
  'Part-time',
];

export const EXPERIENCE_LEVELS = [
  { id: 'fresher', label: 'Fresher', min: 0, max: 1 },
  { id: 'junior', label: '1–3 years', min: 1, max: 3 },
  { id: 'mid', label: '3–6 years', min: 3, max: 6 },
  { id: 'senior', label: '6–10 years', min: 6, max: 10 },
  { id: 'lead', label: '10+ years', min: 10, max: 40 },
];

export const WORK_MODES = ['Remote', 'Hybrid', 'On-site'];

/**
 * Derived from the dataset below rather than hand-maintained, so the filter can
 * never offer a tag that matches no job (a dead end for the user), and no job
 * tag is ever missing from the filter. Ordered by frequency, then alphabetically.
 */
export const getTechTags = (jobs) => {
  const counts = new Map();
  for (const job of jobs) {
    for (const tag of job.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
};

export const JOBS = [
  {
    id: 'j-01',
    title: 'Senior Frontend Engineer',
    company: 'Razorpay',
    logoText: 'RP',
    logoTone: 'indigo',
    location: 'Bengaluru',
    workMode: 'Hybrid',
    roleType: 'Full-time',
    salaryMin: 38,
    salaryMax: 55,
    expMin: 5,
    expMax: 8,
    tags: ['React', 'TypeScript', 'GraphQL', 'AWS'],
    postedAt: daysAgo(1),
    featured: true,
    applicants: 84,
    summary:
      'Own the merchant dashboard that 8 lakh businesses use to track settlements, refunds and disputes.',
    description:
      'You will work on the Razorpay merchant dashboard — the surface where businesses reconcile payments, manage refunds and resolve chargebacks. The frontend guild owns a shared design system used across seven product teams, and you would be one of its senior voices.\n\nThe work is a mix of product delivery and platform investment: shipping features merchants ask for, while steadily paying down the cost of a codebase that grew fast during our Series F years.',
    responsibilities: [
      'Lead frontend architecture for the settlements and disputes modules',
      'Extend the shared component library and review contributions from other teams',
      'Cut dashboard load time on mid-range Android devices, our largest segment',
      'Mentor two or three engineers through design reviews and pairing',
    ],
    requirements: [
      '5+ years building production React applications with TypeScript',
      'Deep understanding of rendering performance and bundle budgets',
      'Experience with GraphQL clients and normalised caching',
      'Comfortable owning a domain end to end, from RFC to on-call',
    ],
    benefits: ['ESOPs with annual refresh', 'Health cover for family + parents', 'Hybrid: 3 days in office'],
  },
  {
    id: 'j-02',
    title: 'Backend Engineer — Payments Core',
    company: 'Zerodha',
    logoText: 'ZD',
    logoTone: 'sky',
    location: 'Bengaluru',
    workMode: 'On-site',
    roleType: 'Full-time',
    salaryMin: 28,
    salaryMax: 42,
    expMin: 3,
    expMax: 6,
    tags: ['Go', 'PostgreSQL', 'Kafka', 'Redis'],
    postedAt: daysAgo(2),
    featured: false,
    applicants: 156,
    summary:
      'Write the services that settle a few thousand crore of trades every morning without drama.',
    description:
      'Zerodha runs the largest retail brokerage in India on a deliberately small engineering team. Payments Core owns fund transfers, margin computation and end-of-day settlement — systems where a rounding error is a regulatory event, not a bug ticket.\n\nWe optimise for boring, legible code and long-lived services. Most of the stack is Go and PostgreSQL, with Kafka moving events between the trading and ledger systems.',
    responsibilities: [
      'Build and operate settlement services against tight exchange deadlines',
      'Model ledger and reconciliation flows that must balance to the paisa',
      'Write the runbooks and alerts for what you ship',
      'Participate in a weekday on-call rotation covering market hours',
    ],
    requirements: [
      '3+ years of backend work in Go, Java or a comparable typed language',
      'Strong relational modelling — you reach for a transaction before a cache',
      'Have operated a service you wrote in production',
      'Bonus: exposure to fintech, ledgers or double-entry accounting',
    ],
    benefits: ['No-notice-period policy', 'Fully in-office, Bengaluru', 'Annual health check-up'],
  },
  {
    id: 'j-03',
    title: 'Machine Learning Engineer',
    company: 'Sarvam AI',
    logoText: 'SA',
    logoTone: 'violet',
    location: 'Bengaluru',
    workMode: 'Hybrid',
    roleType: 'Full-time',
    salaryMin: 45,
    salaryMax: 70,
    expMin: 4,
    expMax: 9,
    tags: ['PyTorch', 'Python', 'Kubernetes', 'GCP'],
    postedAt: daysAgo(1),
    featured: true,
    applicants: 212,
    summary:
      'Train and serve speech and language models for the ten Indian languages most of the internet ignores.',
    description:
      'Sarvam builds foundation models for Indian languages — speech recognition, translation and instruction-tuned LLMs that work on Hindi, Tamil, Telugu, Kannada, Marathi, Bengali and more. Data is scarce and messy, and that is the interesting part.\n\nThis role sits between research and infrastructure: you will run training jobs on multi-node GPU clusters, then make the resulting models cheap enough to serve at Indian price points.',
    responsibilities: [
      'Run distributed training for speech and language models',
      'Build evaluation sets for languages with almost no public benchmarks',
      'Bring inference cost down through quantisation, batching and distillation',
      'Work with linguists to turn qualitative failures into measurable metrics',
    ],
    requirements: [
      '4+ years applied ML with PyTorch in production',
      'Hands-on multi-GPU or multi-node training experience',
      'Solid grounding in transformers — you can read a paper and reimplement it',
      'Bonus: speech (ASR/TTS) or low-resource NLP background',
    ],
    benefits: ['Significant ESOPs', 'Conference and compute budget', 'Hybrid: 3 days in office'],
  },
  {
    id: 'j-04',
    title: 'Product Designer',
    company: 'CRED',
    logoText: 'CR',
    logoTone: 'slate',
    location: 'Bengaluru',
    workMode: 'On-site',
    roleType: 'Full-time',
    salaryMin: 32,
    salaryMax: 48,
    expMin: 4,
    expMax: 8,
    tags: ['Figma', 'Prototyping', 'Design Systems'],
    postedAt: daysAgo(4),
    featured: false,
    applicants: 97,
    summary:
      'Design credit and payment experiences for an audience that notices every pixel you get wrong.',
    description:
      'CRED members are among the most design-literate consumers in the country, and they are unforgiving. You will work on flows where trust is the entire product: credit lines, bill payments, rewards.\n\nThe design team works in small pods with an engineer and a PM, and ships weekly. Craft here is not a finishing step — it is the reason people open the app.',
    responsibilities: [
      'Own end-to-end design for a product area, from problem framing to shipped UI',
      'Prototype interactions at a fidelity engineers can build from directly',
      'Contribute to and extend the CRED design system',
      'Run usability sessions and turn what you learn into design decisions',
    ],
    requirements: [
      '4+ years designing consumer mobile products',
      'A portfolio showing shipped work and the reasoning behind it',
      'Fluent in Figma, including components, variants and auto-layout',
      'Comfortable defending a decision and equally comfortable dropping it',
    ],
    benefits: ['Design tooling budget', 'On-site, Bengaluru', 'Wellness stipend'],
  },
  {
    id: 'j-05',
    title: 'DevOps Engineer',
    company: 'Postman',
    logoText: 'PM',
    logoTone: 'orange',
    location: 'Hyderabad',
    workMode: 'Remote',
    roleType: 'Full-time',
    salaryMin: 26,
    salaryMax: 38,
    expMin: 3,
    expMax: 7,
    tags: ['Kubernetes', 'Terraform', 'AWS', 'Go'],
    postedAt: daysAgo(3),
    featured: false,
    applicants: 63,
    summary:
      'Keep the infrastructure behind 30 million developers boring, observable and cheap.',
    description:
      'Postman runs a large multi-region AWS footprint serving the API platform that most developers use daily. The platform team owns the Kubernetes fleet, the deploy pipeline and the observability stack every product team depends on.\n\nThis is a remote-first role. We care that infrastructure changes are reviewable, reversible and boring.',
    responsibilities: [
      'Manage multi-region EKS clusters and the Terraform that defines them',
      'Improve deploy safety — progressive rollouts, automated rollback',
      'Own cost visibility and drive down spend without hurting reliability',
      'Build internal tooling that lets product teams self-serve',
    ],
    requirements: [
      '3+ years running Kubernetes in production, not just using it',
      'Strong Terraform and AWS fundamentals',
      'Can write real code in Go or Python, not only glue scripts',
      'Incident response experience and a calm write-up habit',
    ],
    benefits: ['Fully remote within India', 'Home-office setup budget', 'Learning allowance'],
  },
  {
    id: 'j-06',
    title: 'Android Engineer',
    company: 'Swiggy',
    logoText: 'SW',
    logoTone: 'amber',
    location: 'Bengaluru',
    workMode: 'Hybrid',
    roleType: 'Full-time',
    salaryMin: 24,
    salaryMax: 36,
    expMin: 2,
    expMax: 5,
    tags: ['Kotlin', 'Jetpack Compose', 'GraphQL'],
    postedAt: daysAgo(5),
    featured: false,
    applicants: 189,
    summary:
      'Ship the ordering flow used by lakhs of people at 8pm, on patchy networks, on cheap phones.',
    description:
      'The Swiggy consumer Android app has to work on a ₹9,000 device with two bars of signal, because that is a large share of real orders. You will work on the ordering and checkout flow, where a 200ms regression is visible in conversion dashboards the next morning.\n\nThe app is migrating to Jetpack Compose, and you would be part of finishing that migration in the checkout surface.',
    responsibilities: [
      'Build and maintain ordering and checkout screens in Kotlin and Compose',
      'Cut cold-start and frame-drop metrics on low-end devices',
      'Instrument flows so product decisions rest on data, not anecdote',
      'Work with backend teams on GraphQL contracts',
    ],
    requirements: [
      '2+ years of Android development in Kotlin',
      'Hands-on Jetpack Compose in a shipped app',
      'Real experience profiling and fixing performance on low-end hardware',
      'Comfort with A/B testing and phased rollouts',
    ],
    benefits: ['Meal allowance', 'Hybrid: 3 days in office', 'Parental leave'],
  },
  {
    id: 'j-07',
    title: 'Data Engineer',
    company: 'Meesho',
    logoText: 'ME',
    logoTone: 'pink',
    location: 'Bengaluru',
    workMode: 'Hybrid',
    roleType: 'Full-time',
    salaryMin: 22,
    salaryMax: 34,
    expMin: 2,
    expMax: 5,
    tags: ['Python', 'Kafka', 'Elasticsearch', 'GCP'],
    postedAt: daysAgo(6),
    featured: false,
    applicants: 141,
    summary:
      'Build the pipelines that tell 14 lakh sellers what is selling, and why it stopped.',
    description:
      'Meesho runs on data from resellers in tier-2 and tier-3 cities, where catalogue quality is uneven and returns are high. The data platform team builds the ingestion and aggregation layer that powers seller analytics, pricing and fraud detection.\n\nYou will own pipelines end to end — from Kafka ingestion through to the aggregates product teams query.',
    responsibilities: [
      'Build streaming and batch pipelines over Kafka and BigQuery',
      'Own data quality checks and freshness SLAs for seller-facing metrics',
      'Model datasets that analysts and ML teams can use without tribal knowledge',
      'Debug the pipeline at 2am when a partition skews',
    ],
    requirements: [
      '2+ years in data engineering with Python',
      'Working knowledge of Kafka or a comparable streaming system',
      'Strong SQL — window functions are not exotic to you',
      'Bonus: dbt, Airflow or BigQuery at scale',
    ],
    benefits: ['ESOPs', 'Hybrid working', 'Relocation support'],
  },
  {
    id: 'j-08',
    title: 'Engineering Manager — Platform',
    company: 'Freshworks',
    logoText: 'FW',
    logoTone: 'emerald',
    location: 'Chennai',
    workMode: 'Hybrid',
    roleType: 'Full-time',
    salaryMin: 55,
    salaryMax: 80,
    expMin: 10,
    expMax: 16,
    tags: ['Java', 'Kubernetes', 'AWS', 'Leadership'],
    postedAt: daysAgo(2),
    featured: true,
    applicants: 47,
    summary:
      'Lead the platform group that every Freshworks product builds on top of.',
    description:
      'Freshworks ships six products from Chennai to customers in over 120 countries. The platform group owns identity, billing, notifications and the shared services layer — internal infrastructure with real external consequences.\n\nYou would manage two teams of five to six engineers, with one tech lead each. This is a hands-off-keyboard role that still expects you to read the code and hold a real technical opinion.',
    responsibilities: [
      'Manage and grow two platform teams, including two tech leads',
      'Own roadmap and quarterly planning against product-team dependencies',
      'Drive reliability targets for services with no acceptable downtime',
      'Hire deliberately, and coach people through the level above their current one',
    ],
    requirements: [
      '10+ years in engineering, with 3+ managing engineers directly',
      'Have built or run multi-tenant SaaS platform services',
      'Track record of shipping across teams you do not control',
      'Clear written communication — we default to documents, not meetings',
    ],
    benefits: ['ESOPs', 'Hybrid: Chennai', 'Leadership coaching budget'],
  },
  {
    id: 'j-09',
    title: 'Full Stack Developer',
    company: 'Zoho',
    logoText: 'ZO',
    logoTone: 'red',
    location: 'Chennai',
    workMode: 'On-site',
    roleType: 'Full-time',
    salaryMin: 14,
    salaryMax: 22,
    expMin: 1,
    expMax: 4,
    tags: ['Java', 'React', 'MongoDB'],
    postedAt: daysAgo(8),
    featured: false,
    applicants: 320,
    summary:
      'Build business software used by companies that will never hear of your framework of choice.',
    description:
      'Zoho builds over fifty business applications from campuses in Chennai and rural Tamil Nadu, with no outside investors and no pressure to chase trends. Software here is expected to last a decade.\n\nYou will work across the stack on one product in the suite, owning features from database schema through to the interface a small-business owner actually uses.',
    responsibilities: [
      'Build features end to end — schema, API and interface',
      'Maintain and extend software that has existing customers and long memories',
      'Write for clarity; someone will read this code in 2034',
      'Support customer escalations for the areas you own',
    ],
    requirements: [
      '1+ years building web applications, or strong fundamentals as a fresher',
      'Comfortable with Java on the backend and React on the frontend',
      'Willing to work on-site in Chennai',
      'Curiosity about the business problem, not only the technical one',
    ],
    benefits: ['On-campus food and transport', 'No-layoff track record', 'Sabbatical policy'],
  },
  {
    id: 'j-10',
    title: 'Frontend Engineer (Contract)',
    company: 'Hasura',
    logoText: 'HA',
    logoTone: 'blue',
    location: 'Remote',
    workMode: 'Remote',
    roleType: 'Contract',
    salaryMin: 18,
    salaryMax: 28,
    expMin: 2,
    expMax: 6,
    tags: ['React', 'TypeScript', 'GraphQL'],
    postedAt: daysAgo(3),
    featured: false,
    applicants: 58,
    summary:
      'Six-month contract rebuilding the Hasura console’s permissions interface.',
    description:
      'The Hasura console is how developers configure GraphQL APIs over their databases. The permissions UI is its most powerful and least approachable surface, and we are rebuilding it.\n\nThis is a six-month contract with the possibility of extension. Fully remote, with overlap expected until 6pm IST.',
    responsibilities: [
      'Rebuild the permissions builder as a guided, inspectable interface',
      'Work directly with two backend engineers on the metadata API',
      'Write component tests for logic that is easy to get subtly wrong',
      'Hand over clean documentation at the end of the contract',
    ],
    requirements: [
      '2+ years with React and TypeScript',
      'Can reason about nested, recursive data structures in a UI',
      'Familiarity with GraphQL — you have written queries, not just read about them',
      'Available for a six-month engagement starting within a month',
    ],
    benefits: ['Fully remote', 'Six-month contract', 'Extension possible'],
  },
  {
    id: 'j-11',
    title: 'SDE Intern — Backend',
    company: 'Groww',
    logoText: 'GR',
    logoTone: 'teal',
    location: 'Bengaluru',
    workMode: 'On-site',
    roleType: 'Internship',
    salaryMin: 6,
    salaryMax: 9,
    expMin: 0,
    expMax: 1,
    tags: ['Java', 'Spring Boot', 'PostgreSQL'],
    postedAt: daysAgo(7),
    featured: false,
    applicants: 412,
    summary:
      'Six-month internship on the mutual funds backend, with a return offer on the table.',
    description:
      'Groww brought stock and mutual fund investing to a generation that had never spoken to a broker. The mutual funds team owns order placement, folio tracking and the reconciliation that keeps them honest.\n\nInterns here own a real project with a real deadline — not a sandbox. Strong performers get a full-time offer at the end of the six months.',
    responsibilities: [
      'Build backend services in Java and Spring Boot under a mentor',
      'Write tests and take part in code reviews from week one',
      'Investigate production issues alongside the on-call engineer',
      'Present your project to the team at the end of the internship',
    ],
    requirements: [
      'Final-year student or recent graduate in any engineering discipline',
      'Solid data structures and algorithms fundamentals',
      'Some exposure to Java or another object-oriented language',
      'Available full-time for six months in Bengaluru',
    ],
    benefits: ['₹50,000–75,000 per month stipend', 'Return offer for strong performers', 'Mentor assigned'],
  },
  {
    id: 'j-12',
    title: 'Site Reliability Engineer',
    company: 'PhonePe',
    logoText: 'PP',
    logoTone: 'purple',
    location: 'Pune',
    workMode: 'Hybrid',
    roleType: 'Full-time',
    salaryMin: 30,
    salaryMax: 46,
    expMin: 4,
    expMax: 9,
    tags: ['Kubernetes', 'Go', 'Terraform', 'Kafka'],
    postedAt: daysAgo(9),
    featured: false,
    applicants: 76,
    summary:
      'Hold the reliability line for a UPI system that processes billions of transactions a month.',
    description:
      'PhonePe handles a substantial share of all UPI traffic in India. At that volume, reliability work is not abstract: a partial outage is a national news story and an NPCI conversation.\n\nSRE at PhonePe owns capacity planning, failure injection and the incident process. You will spend as much time preventing incidents as responding to them.',
    responsibilities: [
      'Own SLOs for core payment paths and defend them in design reviews',
      'Run capacity planning ahead of festival-season traffic peaks',
      'Build and run chaos and failover exercises against production',
      'Lead incident response and write blameless postmortems',
    ],
    requirements: [
      '4+ years in SRE, infrastructure or backend with an operations focus',
      'Deep Kubernetes and Linux knowledge',
      'Have carried a pager for a system with real consequences',
      'Can write tooling in Go or Python',
    ],
    benefits: ['ESOPs', 'Hybrid: Pune', 'On-call compensation'],
  },
];

/** Salary distribution for the insights chart, bucketed in LPA. */
export const SALARY_DISTRIBUTION = [
  { band: '0–10', count: 1 },
  { band: '10–20', count: 2 },
  { band: '20–30', count: 4 },
  { band: '30–40', count: 3 },
  { band: '40–55', count: 1 },
  { band: '55+', count: 1 },
];

/** Filter vocabulary, guaranteed to match the dataset. */
export const TECH_TAGS = getTechTags(JOBS);
