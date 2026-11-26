// Local mirror integration. Original downloaded game modules remain intact.
(() => {
  window.backmirAnalyticsDisabled = true;
  window.gtag = () => {};
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-game-leaderboard]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const game = location.pathname.includes('/classic-hell/') ? 'classic-hell' : location.pathname.includes('/darkforged/') ? 'darkforged' : 'classic';
    const lang = document.documentElement.lang;
    const prefix = "/Game"+(lang.startsWith('en') ? '/en' : lang.startsWith('es') ? '/es' : '');
    window.open(prefix + '/leaderboard/?game=' + game, '_blank', 'noopener');
  }, true);
  const excluded = /(?<=^\/Game)\/(?:en\/|es\/)?(?:games\/[^/]+\/)?(?:community|account|login|register|auth)(?:\/|$)/;
  const clean = () => {
    for (const link of document.querySelectorAll('a[href]')) {
      let url;
      try { url = new URL(link.getAttribute('href'), location.href); } catch { continue; }
      if (url.hostname === 'backmir.org') {
        const local = url.pathname + url.search + url.hash;
        if (link.getAttribute('href') !== local) link.setAttribute('href', local);
      }
      if (excluded.test(url.pathname) && (url.origin === location.origin || url.hostname === 'backmir.org')) {
        link.hidden = true;
      }
      // The separate Nightmare beta is outside the three mirrored games.
      if (url.hostname === 'nightmare.backmir.org') {
        link.hidden = true;
      }
    }
  };
  document.addEventListener('DOMContentLoaded', () => {
    clean();
    new MutationObserver(clean).observe(document.body, { childList: true, subtree: true });
  });
})();
