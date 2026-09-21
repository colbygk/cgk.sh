// Post list: layout switcher, filter, and sticky-offset measuring.
//
// The layout lives on .posts[data-post-layout]; the server renders the
// default (or a page's pinned layout), and this applies the visitor's saved
// choice to unpinned lists. The theme swaps .page__content in via ajax, so
// everything listens on the document and re-syncs when the page changes.
(function () {
  var root = document.documentElement;
  var KEY = 'post-layout';

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function save(id) {
    try { localStorage.setItem(KEY, id); } catch (e) {}
  }

  function filter(query) {
    var q = query.trim().toLowerCase();
    var shown = 0;
    document.querySelectorAll('.post-year').forEach(function (year) {
      var visible = 0;
      year.querySelectorAll('.post').forEach(function (post) {
        var match = !q || post.getAttribute('data-search').indexOf(q) >= 0;
        post.hidden = !match;
        if (match) visible++;
      });
      year.hidden = visible === 0;
      shown += visible;
    });
    var total = document.querySelectorAll('.post').length;
    var count = document.getElementById('post-count');
    if (count) count.textContent = q ? shown + ' of ' + total + ' posts' : total + ' posts';
    var empty = document.getElementById('post-empty');
    if (empty) empty.hidden = shown > 0;
  }

  // Sticky year labels sit below the sticky nav, whose height changes as
  // its contents wrap.
  var nav = null;
  var resize = window.ResizeObserver && new ResizeObserver(measure);
  function measure() {
    if (nav) root.style.setProperty('--post-nav-h', nav.offsetHeight + 'px');
  }

  function sync() {
    var list = document.getElementById('posts');
    if (list && !list.hasAttribute('data-post-layout-pinned')) {
      var want = saved();
      if (want && document.querySelector('[data-layout="' + want + '"]')) {
        list.setAttribute('data-post-layout', want);
      }
      var layout = list.getAttribute('data-post-layout');
      document.querySelectorAll('[data-layout]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-layout') === layout));
      });
    }
    var next = document.querySelector('.post-nav');
    if (next !== nav) {
      if (resize && nav) resize.unobserve(nav);
      nav = next;
      if (resize && nav) resize.observe(nav);
    }
    measure();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-layout]');
    if (!b) return;
    save(b.getAttribute('data-layout'));
    sync();
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'post-filter') filter(e.target.value);
  });

  sync();
  var page = document.querySelector('.page');
  if (page) new MutationObserver(sync).observe(page, { childList: true });
})();
