import { useState, useRef, useEffect } from 'react';
import { Share2, Link as LinkIcon, Check, MessageCircle, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui.jsx';
import { clsx } from '../lib/clsx.js';
import { formatDate, jobPath } from '../lib/format.js';

/**
 * Shares a job to the people a teacher actually reaches — WhatsApp first,
 * since that is how this audience forwards things, plus Telegram, email, and
 * a plain copied link for everything else.
 *
 * The URL is the public /jobs/:id page, which works signed out: a forwarded
 * link that demands a login before showing the role would not survive being
 * passed around a staff-room group.
 */
export const ShareJob = ({
  job,
  variant = 'button',
  className = '',
  // Optional presentation only: stretch to the container, show just the
  // icon (with an accessible name), or open the menu upwards from a bar
  // pinned to the bottom of the screen.
  fullWidth = false,
  iconOnly = false,
  menuAbove = false,
}) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);

  const url = `${window.location.origin}${jobPath(job)}`;

  const message = [
    `${job.title} at Yugam International School`,
    `${job.department} · ${job.location}`,
    job.lastDateToApply ? `Apply by ${formatDate(job.lastDateToApply)}` : '',
    '',
    url,
  ]
    .filter(Boolean)
    .join('\n');

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is denied in some browsers and over plain http.
      toast.error('Could not copy', { description: 'Select the link and copy it by hand.' });
    }
  };

  const channels = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(message)}`,
    },
    {
      key: 'telegram',
      label: 'Telegram',
      icon: Send,
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(
        `${job.title} at Yugam International School`,
      )}`,
    },
    {
      key: 'email',
      label: 'Email',
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(
        `${job.title} — Yugam International School`,
      )}&body=${encodeURIComponent(message)}`,
    },
  ];

  /**
   * On a touch device the operating system's own share sheet reaches every app
   * the person actually has, so prefer it there. Desktop Chrome also exposes
   * navigator.share, but its sheet is a poor substitute for named channels —
   * hence the coarse-pointer check rather than a bare feature test.
   */
  const handleShare = async () => {
    const isTouch =
      typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

    if (navigator.share && isTouch) {
      try {
        await navigator.share({ title: job.title, text: message, url });
        return;
      } catch {
        // A cancelled share sheet is not an error; fall through to the menu.
      }
    }

    setOpen((previous) => !previous);
  };

  return (
    <div ref={containerRef} className={clsx('relative', fullWidth && 'w-full', className)}>
      <Button
        variant={variant === 'ghost' ? 'ghost' : 'secondary'}
        size={iconOnly ? 'icon' : fullWidth ? 'md' : 'sm'}
        onClick={handleShare}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={iconOnly ? `Share ${job.title}` : undefined}
        className={clsx(fullWidth && 'w-full')}
      >
        <Share2 className={iconOnly ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />
        {iconOnly ? null : 'Share'}
      </Button>

      {open ? (
        <div
          role="menu"
          className={clsx(
            'fade-in absolute right-0 z-40 w-60 overflow-hidden rounded-card border border-line bg-field shadow-pop',
            menuAbove ? 'bottom-full mb-2' : 'mt-2',
          )}
        >
          <p className="border-b border-line px-3 py-2 text-meta text-ink-soft">
            Share this role
          </p>

          {channels.map((channel) => (
            <a
              key={channel.key}
              role="menuitem"
              href={channel.href}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-ui text-ink transition-colors duration-micro hover:bg-plum-50 hover:text-plum-800"
            >
              <channel.icon className="h-4 w-4 text-ink-soft" aria-hidden="true" />
              {channel.label}
            </a>
          ))}

          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className="flex w-full items-center gap-2.5 border-t border-line px-3 py-2.5 text-left text-ui text-ink transition-colors duration-micro hover:bg-plum-50 hover:text-plum-800"
          >
            {copied ? (
              <Check className="h-4 w-4 text-status-selected-ink" strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <LinkIcon className="h-4 w-4 text-ink-soft" aria-hidden="true" />
            )}
            {copied ? 'Link copied' : 'Copy link'}
          </button>
        </div>
      ) : null}
    </div>
  );
};
