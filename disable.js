var s = document.createElement("script");
s.setAttribute("id", "multitaskerHelper");
s.textContent = `
/**
 * Monitors changes to the page visibility.
 */
document.addEventListener('visibilitychange', () => {
    console.log('Document.hidden = "${document.hidden}".');
    Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
    });
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
  });`;
(document.head || document.documentElement).appendChild(s);

function manipulatePageVisibility() {
  Object.defineProperty(document, "visibilityState", {
    value: "visible",
    writable: true,
  });
  Object.defineProperty(document, "hidden", { value: false, writable: true });
}
