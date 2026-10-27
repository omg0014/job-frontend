import { Fragment } from 'react';
import { clsx } from '../lib/clsx.js';

/**
 * Staff write job descriptions as plain text: paragraphs separated by blank
 * lines, "- " bullets, and a short label line ("Responsibilities") above a
 * list. This turns that into real paragraphs, headings and lists so it reads
 * as a document rather than a pasted note.
 *
 * Everything is rendered as React text nodes — never as HTML — so whatever is
 * typed into the description has no injection surface.
 */

const BULLET = /^\s*(?:[-*•–]|\d+[.)])\s+/;

/** A short line with no closing full stop, directly above a list, is a label. */
const looksLikeHeading = (line) => {
  const text = line.trim().replace(/:$/, '');
  return text.length > 0 && text.length <= 60 && !/[.!?]$/.test(text);
};

export const parseRichText = (source = '') => {
  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'p', lines: paragraph });
    paragraph = [];
  };
  const flushList = () => {
    if (list?.length) blocks.push({ type: 'ul', items: list });
    list = null;
  };

  const lines = String(source).replace(/\r\n?/g, '\n').split('\n');

  lines.forEach((raw, index) => {
    const line = raw.trimEnd();

    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }

    if (BULLET.test(line)) {
      // A lone label line just before the first bullet becomes its heading.
      if (!list && paragraph.length && looksLikeHeading(paragraph[paragraph.length - 1])) {
        const label = paragraph.pop();
        flushParagraph();
        blocks.push({ type: 'h', text: label.trim().replace(/:$/, '') });
      } else {
        flushParagraph();
      }
      list = list ?? [];
      list.push(line.replace(BULLET, '').trim());
      return;
    }

    // A label line that is followed straight away by bullets starts a new
    // section even without a blank line before it.
    const next = lines[index + 1];
    if (list && next !== undefined && BULLET.test(next) && looksLikeHeading(line)) {
      flushList();
      paragraph = [line];
      return;
    }

    flushList();
    paragraph.push(line.trim());
  });

  flushParagraph();
  flushList();
  return blocks;
};

export const RichText = ({ text, className = '' }) => {
  const blocks = parseRichText(text);
  if (blocks.length === 0) return null;

  return (
    <div className={clsx('prose-job', className)}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        if (block.type === 'h') return <h3 key={key}>{block.text}</h3>;
        if (block.type === 'ul') {
          return (
            <ul key={key}>
              {block.items.map((item, itemIndex) => (
                // eslint-disable-next-line react/no-array-index-key -- static text, order is identity
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={key} className="leading-relaxed">
            {block.lines.map((line, lineIndex) => (
              // eslint-disable-next-line react/no-array-index-key -- static text, order is identity
              <Fragment key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};
