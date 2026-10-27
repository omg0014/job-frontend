import { useState } from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ErrorState, buttonClass } from './ui.jsx';
import { Spinner } from './Loading.jsx';
import { useFileBlob, downloadFile } from '../hooks/useFileBlob.js';
import { endpoints } from '../api/endpoints.js';

/**
 * Embedded CV preview for the admin applicant view.
 *
 * The download endpoint is a POST, which an <iframe src> cannot issue — so the
 * file is fetched as a blob and the iframe is fed the resulting object URL. The
 * hook revokes that URL on unmount.
 */
export const CvViewer = ({ applicationId, fileName }) => {
  const [downloading, setDownloading] = useState(false);

  const { url, loading, error, mimeType } = useFileBlob(endpoints.applications.downloadCv, {
    applicationId,
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadFile(
        endpoints.applications.downloadCv,
        { applicationId },
        fileName || 'cv.pdf',
      );
    } catch (downloadError) {
      toast.error(downloadError.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-line/80 bg-field shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-plum-500" aria-hidden="true" />
          <h2 className="truncate text-ui font-semibold text-ink">
            {fileName || 'Original CV'}
          </h2>
        </div>

        <div className="flex gap-1.5">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className={buttonClass({ variant: 'ghost', size: 'sm' })}
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Open
            </a>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            disabled={downloading || loading}
          >
            {downloading ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Download
          </Button>
        </div>
      </div>

      {/* An explicit height, not flex-1: a 0% flex-basis would make the height
          indefinite, and the iframe's h-full would collapse to its 150px default. */}
      <div className="relative h-[70vh] min-h-[420px] shrink-0 bg-paper lg:h-[calc(100vh-17rem)]">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Spinner className="h-5 w-5 text-plum-600" />
              <p className="text-meta text-ink-soft">Loading CV…</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-5">
            <ErrorState message={error} />
          </div>
        ) : mimeType?.includes('pdf') ? (
          <iframe src={url} title="Candidate CV" className="absolute inset-0 h-full w-full border-0" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <FileText className="h-8 w-8 text-ink-soft/70" aria-hidden="true" />
            <p className="max-w-xs text-ui text-ink-soft">
              This is a Word document, which browsers cannot preview inline. Download it to
              read the original.
            </p>
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={downloading}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download CV
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
