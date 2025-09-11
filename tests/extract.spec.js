import { describe, it, expect, beforeEach } from 'vitest';
import { extractHrefs } from '../helpers/extract.js';

describe('extractHrefs', () => {
  beforeEach(() => {
    // Ensure a base URL for absolute resolution in JSDOM
    document.head.innerHTML = '<base href="https://example.com/root/">';
    document.body.innerHTML = '';
  });

  it('returns empty array for null/invalid root', () => {
    expect(extractHrefs(null)).toEqual([]);
    expect(extractHrefs({})).toEqual([]);
  });

  it('extracts only valid hrefs', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <a href="/a">A</a>
      <a href>empty</a>
      <a>No href</a>
      <span><a href="https://foo.bar/b">B</a></span>
    `;
    const hrefs = extractHrefs(div);
    expect(hrefs).toEqual([
      'https://example.com/a',
      'https://foo.bar/b',
    ]);
  });

  it('keeps duplicates as-is (no dedupe)', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <a href="/same">1</a>
      <a href="/same">2</a>
    `;
    const hrefs = extractHrefs(div);
    expect(hrefs).toEqual([
      'https://example.com/same',
      'https://example.com/same',
    ]);
  });
});
