import { ButtonLink } from '../../components/ui.jsx';

export const NotFoundPage = () => (
  <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
    <p data-stat className="font-serif text-hero text-plum-200">
      404
    </p>
    <h1 className="mt-3 font-serif text-title font-semibold text-ink">Page not found</h1>
    <p className="mt-2 text-ui text-ink-soft">
      The page you are looking for does not exist or has been moved.
    </p>
    <div className="mt-7 flex flex-wrap justify-center gap-3">
      <ButtonLink to="/">Back to home</ButtonLink>
      <ButtonLink to="/jobs" variant="secondary">
        See open roles
      </ButtonLink>
    </div>
  </div>
);
