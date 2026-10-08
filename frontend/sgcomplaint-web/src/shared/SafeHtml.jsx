import DOMPurify from 'dompurify';

export default function SafeHtml({ html, className = '' }) {
  const clean = DOMPurify.sanitize(html || '', {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style', 'onerror', 'onload'],
  });
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
