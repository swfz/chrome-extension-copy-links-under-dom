import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showToast } from '../helpers/toast.js';

describe('toast helper', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // Basic RAF polyfill for consistency in tests
    globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    vi.useFakeTimers();
  });

  it('creates container and shows success toast', () => {
    showToast(document, 'OK', 'success', 1000);
    const container = document.querySelector('.link-toast-container');
    expect(container).toBeTruthy();
    const toast = container.querySelector('.link-toast.success');
    expect(toast).toBeTruthy();
    expect(toast.textContent).toBe('OK');
  });

  it('auto-dismisses and cleans container when last toast removed', () => {
    showToast(document, 'A', 'success', 500);
    let container = document.querySelector('.link-toast-container');
    expect(container).toBeTruthy();

    // lifespan + transition
    vi.advanceTimersByTime(500 + 200);

    container = document.querySelector('.link-toast-container');
    expect(container).toBeFalsy();
  });
});
