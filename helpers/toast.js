// Simple toast helper. Adds/removes DOM nodes and handles auto-dismiss.
const DEFAULT_LIFESPAN = 2600;

export function ensureToastContainer(doc) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d) return null;
  let container = d.querySelector('.link-toast-container');
  if (!container) {
    container = d.createElement('div');
    container.className = 'link-toast-container';
    d.body.appendChild(container);
  }
  return container;
}

export function showToast(doc, message, type = 'success', lifespanMs = DEFAULT_LIFESPAN) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d) return;
  const container = ensureToastContainer(d);
  if (!container) return;

  const toast = d.createElement('div');
  toast.className = `link-toast ${type}`;
  toast.textContent = String(message);
  container.appendChild(toast);

  const raf = (cb) =>
    (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : setTimeout(cb, 0));

  raf(() => {
    toast.classList.add('show');
  });

  const remove = () => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
      if (container.childElementCount === 0) {
        container.remove();
      }
    }, 180);
  };

  setTimeout(remove, lifespanMs);
}
