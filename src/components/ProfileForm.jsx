import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, useReducedMotion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Card, Button } from './ui.jsx';
import {
  Field,
  Input,
  Textarea,
  ChipInput,
  Checkbox,
  ErrorSummary,
  flattenErrors,
  firstMessage,
  focusField,
} from './form.jsx';
import { Spinner } from './Loading.jsx';
import { useTaxonomy } from '../hooks/useTaxonomy.js';

/**
 * Only the required fields are checked — name, phone, email and years of
 * experience — because those are how the school reaches the teacher. Every
 * optional field takes whatever was written, picked or read from the CV, with
 * no length limits, matching backend/src/validators/profile.validators.js.
 */

/** Optional text: a parsed null or number becomes a plain string. */
const optionalText = z.preprocess(
  (value) => (value === null || value === undefined ? '' : String(value)),
  z.string().trim(),
);

/** Optional chip list: blanks dropped, nothing else rejected. */
const optionalList = z.preprocess(
  (value) => (Array.isArray(value) ? value : []),
  z.array(z.any()).transform((items) =>
    items
      .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
      .filter(Boolean),
  ),
);

const optionalRows = (schema) =>
  z.preprocess((value) => (Array.isArray(value) ? value : []), z.array(schema));

const educationSchema = z.object({
  degree: optionalText,
  specialization: optionalText,
  institution: optionalText,
  boardOrUniversity: optionalText,
  yearOfPassing: optionalText,
  percentageOrCgpa: optionalText,
});

const experienceSchema = z.object({
  designation: optionalText,
  organization: optionalText,
  subjectsTaught: optionalList,
  startDate: optionalText,
  endDate: optionalText,
  isCurrent: z.preprocess((value) => Boolean(value), z.boolean()),
  description: optionalText,
});

export const profileSchema = z.object({
  // Required.
  fullName: z.string().trim().min(2, 'Your full name is required').max(120),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[-\s]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  totalExperienceYears: z.coerce
    .number({ invalid_type_error: 'Enter a number' })
    .min(0, 'Cannot be negative')
    .max(60, 'That seems too high'),

  // Optional — accepted as written.
  location: optionalText,
  headline: optionalText,
  education: optionalRows(educationSchema),
  experience: optionalRows(experienceSchema),
  subjects: optionalList,
  skills: optionalList,
  certifications: optionalList,
  languages: optionalList,
  preferredDepartments: optionalList,
});

const FIELD_LABELS = {
  fullName: 'Full name',
  phone: 'Phone',
  email: 'Email',
  location: 'Location',
  headline: 'Headline',
  totalExperienceYears: 'Total experience',
  subjects: 'Subjects you teach',
  skills: 'Skills',
  certifications: 'Certifications',
  languages: 'Languages',
  preferredDepartments: 'Preferred departments',
};

const EDUCATION_LABELS = {
  degree: 'Degree',
  specialization: 'Specialization',
  institution: 'Institution',
  boardOrUniversity: 'Board / University',
  yearOfPassing: 'Year of passing',
  percentageOrCgpa: 'Percentage / CGPA',
};

const EXPERIENCE_LABELS = {
  designation: 'Designation',
  organization: 'School / organization',
  subjectsTaught: 'Subjects taught',
  startDate: 'From',
  endDate: 'To',
  isCurrent: 'I currently work here',
  description: 'What you did',
};

/** Which form section a field path belongs to, for the "Needs attention" marker. */
const sectionOf = (name = '') => {
  const head = name.split('.')[0];
  if (head === 'education') return 'education';
  if (head === 'experience') return 'experience';
  if (['subjects', 'skills', 'certifications', 'languages', 'preferredDepartments'].includes(head)) {
    return 'skills';
  }
  return 'about';
};

/** "education.0.yearOfPassing" → "Qualification 1 · Year of passing". */
const labelFor = (name = '') => {
  const [head, index, field] = name.split('.');
  if (head === 'education') {
    if (index === undefined) return 'Education';
    return `Qualification ${Number(index) + 1}${field ? ` · ${EDUCATION_LABELS[field] ?? field}` : ''}`;
  }
  if (head === 'experience') {
    if (index === undefined) return 'Teaching experience';
    return `Role ${Number(index) + 1}${field ? ` · ${EXPERIENCE_LABELS[field] ?? field}` : ''}`;
  }
  return FIELD_LABELS[head] ?? head;
};

/**
 * One entry per field: a chip list with three bad chips is one problem to
 * fix, not three. Kept in the order the fields appear on the page.
 */
const FIELD_ORDER = [
  'fullName', 'phone', 'email', 'location', 'headline', 'totalExperienceYears',
  'education', 'experience',
  'subjects', 'skills', 'certifications', 'languages', 'preferredDepartments',
];
const summarise = (errors) => {
  const seen = new Set();
  return flattenErrors(errors)
    .map((item) => {
      const [head, index, field] = item.name.split('.');
      // Collapse chip items ("subjects.3") onto their list.
      const name = head === 'education' || head === 'experience'
        ? [head, index, field].filter((part) => part !== undefined).join('.')
        : head;
      return { name, label: labelFor(name), message: item.message };
    })
    .filter((item) => (seen.has(item.name) ? false : seen.add(item.name)))
    .sort((a, b) => {
      const rank = (n) => FIELD_ORDER.indexOf(n.split('.')[0]);
      const [, ai = 0] = a.name.split('.');
      const [, bi = 0] = b.name.split('.');
      return rank(a.name) - rank(b.name) || Number(ai) - Number(bi);
    });
};

const emptyEducation = {
  degree: '',
  specialization: '',
  institution: '',
  boardOrUniversity: '',
  yearOfPassing: '',
  percentageOrCgpa: '',
};

const emptyExperience = {
  designation: '',
  organization: '',
  subjectsTaught: [],
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
};

/**
 * Sections stagger in 40ms apart when a CV has just been parsed — the teacher
 * watches the form fill itself, which is what makes the parsing feel like more
 * than a form. Only transform and opacity move.
 */
const Section = ({
  title,
  description,
  children,
  action,
  index = 0,
  stagger = false,
  field,
  hasError = false,
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      data-field={field}
      initial={stagger && !reduceMotion ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.04, ease: [0.32, 0.72, 0, 1] }}
    >
      <Card
        className={
          hasError
            ? 'p-5 transition-colors duration-base sm:p-7 border-status-rejected-ink/40'
            : 'p-5 transition-colors duration-base sm:p-7'
        }
      >
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-center gap-x-3 gap-y-1 font-serif text-heading font-semibold text-ink">
              {title}
              {hasError ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-status-rejected px-2 py-0.5 font-sans text-meta font-semibold text-status-rejected-ink">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Needs attention
                </span>
              ) : null}
            </h2>
            {description ? (
              <p className="mt-0.5 text-ui text-ink-soft">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
        {children}
      </Card>
    </motion.section>
  );
};

/**
 * The profile form, used both for reviewing a freshly parsed CV and for editing
 * a saved profile. `autoFilledFields` drives the "auto-filled" badges that tell
 * a teacher which values came from the parser and deserve a second look.
 */
export const ProfileForm = ({
  defaultValues,
  autoFilledFields = [],
  onSubmit,
  submitLabel = 'Save profile',
  isSubmitting = false,
  footerNote,
  stagger = false,
}) => {
  const { data: taxonomy } = useTaxonomy();
  // auto-animate handles add/remove/reorder on the repeatable rows in one line.
  const [educationRef] = useAutoAnimate();
  const [experienceRef] = useAutoAnimate();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues,
    // Focus is handled below: a smooth scroll to the first problem, in page
    // order, including chip lists that RHF cannot focus on its own.
    shouldFocusError: false,
  });

  const education = useFieldArray({ control, name: 'education' });
  const experience = useFieldArray({ control, name: 'experience' });

  // Only show the summary once saving has been tried; it then shrinks live as
  // each field is corrected, because RHF re-validates on change after submit.
  const [attempted, setAttempted] = useState(false);
  const problems = attempted ? summarise(errors) : [];
  const sectionsWithErrors = new Set(problems.map((item) => sectionOf(item.name)));

  const isAuto = (field) => autoFilledFields.includes(field);

  /** Tell the teacher what is wrong and take them to it. */
  const reportProblems = (list) => {
    setAttempted(true);
    if (list.length === 0) return;
    const [first] = list;
    toast.error(
      list.length === 1
        ? 'One detail needs fixing before you can save'
        : `${list.length} details need fixing before you can save`,
      { description: `${first.label}: ${first.message}` },
    );
    focusField(first.name);
  };

  const onValid = async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      // The server checks the same rules; if it still names fields (an
      // older client, or a rule only the server knows), show them inline.
      const serverErrors = error?.details?.errors ?? [];
      const fieldErrors = serverErrors.filter((item) => item.field && item.field !== '(body)');
      if (fieldErrors.length === 0) return; // The page's own onError has toasted.

      fieldErrors.forEach((item) =>
        setError(item.field, { type: 'server', message: item.message }),
      );
      reportProblems(
        summarise(
          Object.fromEntries(fieldErrors.map((item) => [item.field, { message: item.message }])),
        ),
      );
    }
  };

  const onInvalid = (formErrors) => reportProblems(summarise(formErrors));

  /** The error message for one row field, e.g. education.0.yearOfPassing. */
  const rowError = (group, index, field) => errors[group]?.[index]?.[field]?.message;

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-8 sm:space-y-12" noValidate>
      <Section
        title="About you"
        description="How we reach you and what you do."
        index={0}
        stagger={stagger}
        field="about"
        hasError={sectionsWithErrors.has('about')}
      >
        <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
          <Field
            label="Full name"
            htmlFor="fullName"
            required
            error={errors.fullName?.message}
            autoFilled={isAuto('fullName')}
          >
            <Input id="fullName" error={errors.fullName} {...register('fullName')} />
          </Field>

          <Field
            label="Phone"
            htmlFor="phone"
            required
            error={errors.phone?.message}
            autoFilled={isAuto('phone')}
          >
            <Input
              id="phone"
              inputMode="tel"
              placeholder="9876543210"
              error={errors.phone}
              {...register('phone')}
            />
          </Field>

          <Field
            label="Email"
            htmlFor="email"
            required
            error={errors.email?.message}
            autoFilled={isAuto('email')}
          >
            <Input id="email" type="email" error={errors.email} {...register('email')} />
          </Field>

          <Field
            label="Location"
            htmlFor="location"
            error={errors.location?.message}
            autoFilled={isAuto('location')}
          >
            <Input
              id="location"
              placeholder="Coimbatore"
              error={errors.location}
              {...register('location')}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field
              label="Headline"
              htmlFor="headline"
              hint="One line that sums up your teaching experience."
              error={errors.headline?.message}
              autoFilled={isAuto('headline')}
            >
              <Input
                id="headline"
                placeholder="PGT Physics with 7 years of CBSE senior secondary experience"
                error={errors.headline}
                {...register('headline')}
              />
            </Field>
          </div>

          <Field
            label="Total experience (years)"
            htmlFor="totalExperienceYears"
            required
            error={errors.totalExperienceYears?.message}
            autoFilled={isAuto('totalExperienceYears')}
          >
            <Input
              id="totalExperienceYears"
              type="number"
              min="0"
              max="60"
              step="0.5"
              error={errors.totalExperienceYears}
              {...register('totalExperienceYears')}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Education"
        description="Your degrees and teaching qualifications."
        index={1}
        stagger={stagger}
        field="education"
        hasError={sectionsWithErrors.has('education')}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => education.append(emptyEducation)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add qualification
          </Button>
        }
      >
        {education.fields.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-4 py-8 text-center text-ui text-ink-soft">
            No education added yet. Use “Add qualification” to include your degrees.
          </p>
        ) : (
          <div ref={educationRef} className="space-y-4">
            {education.fields.map((field, index) => (
              <div key={field.id} className="rounded-card border border-line bg-field p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-meta font-semibold text-ink-soft">
                    Qualification {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => education.remove(index)}
                    className="-m-1 rounded-control p-2 text-ink-soft transition-colors duration-micro hover:bg-status-rejected hover:text-status-rejected-ink"
                    aria-label={`Remove qualification ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
                  <Field
                    label="Degree"
                    htmlFor={`edu-degree-${index}`}
                    error={rowError('education', index, 'degree')}
                  >
                    <Input
                      id={`edu-degree-${index}`}
                      placeholder="M.Sc."
                      error={rowError('education', index, 'degree')}
                      {...register(`education.${index}.degree`)}
                    />
                  </Field>
                  <Field
                    label="Specialization"
                    htmlFor={`edu-spec-${index}`}
                    error={rowError('education', index, 'specialization')}
                  >
                    <Input
                      id={`edu-spec-${index}`}
                      placeholder="Physics"
                      error={rowError('education', index, 'specialization')}
                      {...register(`education.${index}.specialization`)}
                    />
                  </Field>
                  <Field
                    label="Institution"
                    htmlFor={`edu-inst-${index}`}
                    error={rowError('education', index, 'institution')}
                  >
                    <Input
                      id={`edu-inst-${index}`}
                      error={rowError('education', index, 'institution')}
                      {...register(`education.${index}.institution`)}
                    />
                  </Field>
                  <Field
                    label="Board / University"
                    htmlFor={`edu-board-${index}`}
                    error={rowError('education', index, 'boardOrUniversity')}
                  >
                    <Input
                      id={`edu-board-${index}`}
                      error={rowError('education', index, 'boardOrUniversity')}
                      {...register(`education.${index}.boardOrUniversity`)}
                    />
                  </Field>
                  <Field
                    label="Year of passing"
                    htmlFor={`edu-year-${index}`}
                    error={rowError('education', index, 'yearOfPassing')}
                  >
                    <Input
                      id={`edu-year-${index}`}
                      placeholder="2017"
                      error={rowError('education', index, 'yearOfPassing')}
                      {...register(`education.${index}.yearOfPassing`)}
                    />
                  </Field>
                  <Field
                    label="Percentage / CGPA"
                    htmlFor={`edu-grade-${index}`}
                    error={rowError('education', index, 'percentageOrCgpa')}
                  >
                    <Input
                      id={`edu-grade-${index}`}
                      placeholder="82"
                      error={rowError('education', index, 'percentageOrCgpa')}
                      {...register(`education.${index}.percentageOrCgpa`)}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Teaching experience"
        description="Where you have taught, and what."
        index={2}
        stagger={stagger}
        field="experience"
        hasError={sectionsWithErrors.has('experience')}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => experience.append(emptyExperience)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add role
          </Button>
        }
      >
        {experience.fields.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-4 py-8 text-center text-ui text-ink-soft">
            No experience added yet. Use “Add role” to include where you have taught.
          </p>
        ) : (
          <div ref={experienceRef} className="space-y-4">
            {experience.fields.map((field, index) => (
              <div key={field.id} className="rounded-card border border-line bg-field p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-meta font-semibold text-ink-soft">
                    Role {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => experience.remove(index)}
                    className="-m-1 rounded-control p-2 text-ink-soft transition-colors duration-micro hover:bg-status-rejected hover:text-status-rejected-ink"
                    aria-label={`Remove role ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
                  <Field
                    label="Designation"
                    htmlFor={`exp-desig-${index}`}
                    error={rowError('experience', index, 'designation')}
                  >
                    <Input
                      id={`exp-desig-${index}`}
                      placeholder="PGT Physics"
                      error={rowError('experience', index, 'designation')}
                      {...register(`experience.${index}.designation`)}
                    />
                  </Field>
                  <Field
                    label="School / organization"
                    htmlFor={`exp-org-${index}`}
                    error={rowError('experience', index, 'organization')}
                  >
                    <Input
                      id={`exp-org-${index}`}
                      error={rowError('experience', index, 'organization')}
                      {...register(`experience.${index}.organization`)}
                    />
                  </Field>
                  <Field
                    label="From"
                    htmlFor={`exp-start-${index}`}
                    error={rowError('experience', index, 'startDate')}
                  >
                    <Input
                      id={`exp-start-${index}`}
                      placeholder="2019"
                      error={rowError('experience', index, 'startDate')}
                      {...register(`experience.${index}.startDate`)}
                    />
                  </Field>
                  <Field
                    label="To"
                    htmlFor={`exp-end-${index}`}
                    error={rowError('experience', index, 'endDate')}
                  >
                    <Input
                      id={`exp-end-${index}`}
                      placeholder="2023"
                      disabled={watch(`experience.${index}.isCurrent`)}
                      error={rowError('experience', index, 'endDate')}
                      {...register(`experience.${index}.endDate`)}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Checkbox
                      label="I currently work here"
                      {...register(`experience.${index}.isCurrent`)}
                    />
                  </div>

                  <div className="sm:col-span-2" data-field={`experience.${index}.subjectsTaught`}>
                    <Field
                      label="Subjects taught"
                      htmlFor={`exp-subjects-${index}`}
                      error={firstMessage(errors.experience?.[index]?.subjectsTaught)}
                    >
                      <Controller
                        control={control}
                        name={`experience.${index}.subjectsTaught`}
                        render={({ field: chipField }) => (
                          <ChipInput
                            value={chipField.value ?? []}
                            onChange={chipField.onChange}
                            suggestions={taxonomy?.subjects ?? []}
                            placeholder="Physics, Mathematics…"
                          />
                        )}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field
                    label="What you did"
                    htmlFor={`exp-desc-${index}`}
                    error={rowError('experience', index, 'description')}
                  >
                      <Textarea
                        id={`exp-desc-${index}`}
                        rows={3}
                        placeholder="Classes taught, responsibilities, achievements…"
                        error={rowError('experience', index, 'description')}
                      {...register(`experience.${index}.description`)}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Subjects and skills"
        description="These help us match you to openings."
        index={3}
        stagger={stagger}
        field="skills"
        hasError={sectionsWithErrors.has('skills')}
      >
        <div className="space-y-6">
          <div data-field="subjects">
          <Field label="Subjects you teach"
            error={firstMessage(errors.subjects)} autoFilled={isAuto('subjects')}>
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
          </div>

          <div data-field="skills">
          <Field label="Skills"
            error={firstMessage(errors.skills)} autoFilled={isAuto('skills')}>
            <Controller
              control={control}
              name="skills"
              render={({ field }) => (
                <ChipInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                  suggestions={taxonomy?.skills ?? []}
                  placeholder="Lesson Planning, Classroom Management…"
                />
              )}
            />
          </Field>
          </div>

          <div data-field="certifications">
          <Field
            label="Certifications"
            error={firstMessage(errors.certifications)}
            hint="B.Ed, CTET, NET and similar."
            autoFilled={isAuto('certifications')}
          >
            <Controller
              control={control}
              name="certifications"
              render={({ field }) => (
                <ChipInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                  suggestions={taxonomy?.qualifications ?? []}
                  placeholder="B.Ed, CTET…"
                />
              )}
            />
          </Field>
          </div>

          <div data-field="languages">
          <Field label="Languages"
            error={firstMessage(errors.languages)} autoFilled={isAuto('languages')}>
            <Controller
              control={control}
              name="languages"
              render={({ field }) => (
                <ChipInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                  suggestions={taxonomy?.languages ?? []}
                  placeholder="English, Tamil…"
                />
              )}
            />
          </Field>
          </div>

          <div data-field="preferredDepartments">
          <Field label="Preferred departments"
            error={firstMessage(errors.preferredDepartments)} hint="Where you would most like to teach.">
            <Controller
              control={control}
              name="preferredDepartments"
              render={({ field }) => (
                <ChipInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                  suggestions={taxonomy?.departments ?? []}
                  placeholder="Senior Secondary, Primary…"
                />
              )}
            />
          </Field>
          </div>
        </div>
      </Section>

      {/* Beside the save button, where the eye is when saving fails. Each
          entry jumps to its field. */}
      <ErrorSummary
        title={
          problems.length === 1
            ? 'One detail needs fixing before you can save'
            : `${problems.length} details need fixing before you can save`
        }
        items={problems}
        onSelect={focusField}
      />

      {/* Plain footer rather than a sticky bar: this form is long, and a bar
          pinned over a field the user is typing into gets in the way. */}
      <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-meta text-ink-soft">{footerNote}</p>
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? <Spinner /> : null}
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
};
