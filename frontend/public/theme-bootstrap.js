// Apply theme before React mounts so the first paint already matches the
// user's preference (no FOUC flash from light → dark).
// Lives in /public (not inline) so CSP can be `script-src 'self'` without
// needing 'unsafe-inline' or per-page hashes.
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = stored === 'dark' || (stored !== 'light' && prefersDark) ? 'dark' : 'light';
    if (resolved === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = resolved;
  } catch (_) {}
})();
