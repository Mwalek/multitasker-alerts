var s = document.createElement("script");
s.setAttribute("id", "multitaskerHelper");
s.textContent = `
/**
 * Monitors changes to the page visibility.
 */
document.addEventListener('visibilitychange', () => {
  /**
   * Uncomment this line to debug whether the
   * Page Visibility API is being spoofed.
   * console.log('Document.hidden = "${document.hidden}".');
   **/
    Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
    });
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
  });`;
(document.head || document.documentElement).appendChild(s);
