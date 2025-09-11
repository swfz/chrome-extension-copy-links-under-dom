import { describe, it, expect, vi, beforeEach } from 'vitest';

// Ensure jsdom base URL for absolute href resolution if needed
const setBase = () => {
  document.head.innerHTML = '<base href="https://example.com/">';
};

describe('content script integration', () => {
  let listeners;

  let writeTextSpy;

  beforeEach(async () => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    setBase();

    // RAF polyfill so toast 'show' transition kicks in consistently
    globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);

    // Mock clipboard on existing navigator (jsdom defines it)
    writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true,
    });

    // Mock chrome.runtime message API
    listeners = [];
    // eslint-disable-next-line no-global-assign
    globalThis.chrome = {
      runtime: {
        onMessage: {
          addListener: (cb) => listeners.push(cb),
        },
      },
    };

    // Reset module cache and import content script (registers listeners)
    vi.resetModules();
    await import('../content.js');
  });

  const activate = () => {
    for (const cb of listeners) {
      cb({ action: 'activate_inspector' }, {}, () => {});
    }
  };

  it('highlights on hover, shows link count, copies on click and shows success toast', async () => {
    // Prepare DOM
    const container = document.createElement('div');
    container.id = 'container';
    container.innerHTML = `
      <a href="/a">A</a>
      <a href="https://foo/bar">B</a>
    `;
    document.body.appendChild(container);

    // Activate content script
    activate();

    // Hover
    const mouseEvent = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100,
    });
    container.dispatchEvent(mouseEvent);

    // Assert highlight and popup
    expect(container.classList.contains('inspector-highlight')).toBe(true);
    const popup = document.querySelector('.link-count-popup');
    expect(popup).toBeTruthy();
    expect(popup.textContent).toContain('Links: 2');

    // Click to copy
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    container.dispatchEvent(clickEvent);

    // Clipboard called with joined hrefs
    expect(writeTextSpy).toHaveBeenCalledTimes(1);
    const copied = writeTextSpy.mock.calls[0][0];
    expect(copied.split('\n').length).toBe(2);

    // Allow promise microtasks and RAF to run
    await Promise.resolve();
    await Promise.resolve();
    vi.advanceTimersByTime(0);

    // Success toast appears
    const toast = document.querySelector('.link-toast.success');
    expect(toast).toBeTruthy();
    expect(toast.textContent).toContain('Copied');

    // After deactivate, further mouseover should not re-highlight
    const afterMouse = new MouseEvent('mouseover', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 });
    container.classList.remove('inspector-highlight');
    container.dispatchEvent(afterMouse);
    expect(container.classList.contains('inspector-highlight')).toBe(false);

    // Let toast disappear
    vi.advanceTimersByTime(3000);
    expect(document.querySelector('.link-toast-container')).toBeFalsy();
  });

  it('shows error toast when no links are found', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    activate();

    target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true, clientX: 1, clientY: 1 }));
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    // Clipboard should not be called
    expect(writeTextSpy).not.toHaveBeenCalled();

    // Error toast
    const toast = document.querySelector('.link-toast.error');
    expect(toast).toBeTruthy();
    expect(toast.textContent).toContain('No links found');

    vi.advanceTimersByTime(3000);
    expect(document.querySelector('.link-toast-container')).toBeFalsy();
  });

  it('shows error toast when clipboard write fails', async () => {
    // Container with links
    const container = document.createElement('div');
    container.innerHTML = `
      <a href="/x">X</a>
    `;
    document.body.appendChild(container);

    // Force clipboard failure for this call
    // writeTextSpy is set in beforeEach via defineProperty
    const writeTextSpy = navigator.clipboard.writeText;
    writeTextSpy.mockRejectedValueOnce(new Error('denied'));

    activate();

    // Hover and click
    container.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }));
    container.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    // Allow promise microtasks and RAF to run (retry a few ticks)
    let errorToast = null;
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
      vi.advanceTimersByTime(0);
      errorToast = document.querySelector('.link-toast.error');
      if (errorToast) break;
    }
    expect(errorToast).toBeTruthy();
    expect(errorToast.textContent).toContain('Copy failed');

    // Clean up toasts
    vi.advanceTimersByTime(3000);
    expect(document.querySelector('.link-toast-container')).toBeFalsy();
  });
});
