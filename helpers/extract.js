// Minimal, testable helper for extracting hrefs from a root element.
export function extractHrefs(rootEl) {
  if (!rootEl || !rootEl.querySelectorAll) return [];
  const hrefs = Array.from(rootEl.querySelectorAll('a'))
    .filter((a) => {
      if (!a) return false;

      const raw = a.getAttribute('href');
      if (raw == null) return false;

      const trimmed = String(raw).trim();
      if (!trimmed) return false; // exclude empty

      if (trimmed === '#') return false; // exclude hash-only anchors

      return true;
    })
    .map((a) => a.href)
    .filter(Boolean);

  return hrefs;
}
