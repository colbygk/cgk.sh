// Image viewer: click an image to see it large, then step through every
// zoomable image on the page (buttons, arrow keys, swipe). Esc, the close
// button or a click on the backdrop closes it.
//
// Zoomable: gallery photos, images in page content (.single) that link to
// a larger copy of themselves, and unlinked content images big enough to
// be worth enlarging. Images linking to web pages stay plain links.
//
// Listens on the document and re-marks images when the theme swaps pages
// in via ajax, like js/blog.js.
(function () {
  var MIN_SIZE = 480; // px; smaller unlinked images aren't worth enlarging
  var IMAGE_HREF = /\.(jpe?g|png|gif|webp|avif)(\?.*)?$/i;

  // Where to find the large version and caption of an image, or null if
  // it shouldn't open in the viewer.
  function candidate(img) {
    // .cloned: copies the carousel makes of its slides so it can loop.
    if (img.closest('.lightbox, .post-video, .intro, .cloned')) return null;
    var inGallery = img.closest('.gallery');
    if (!inGallery && !img.closest('.single')) return null;

    var link = img.closest('a[href]');
    var src;
    if (link && !link.classList.contains('gallery__item__link')) {
      if (!IMAGE_HREF.test(link.getAttribute('href'))) return null;
      src = link.href;
    } else if (inGallery) {
      src = link ? link.href : img.currentSrc || img.src;
    } else {
      if (!img.complete || Math.max(img.naturalWidth, img.naturalHeight) < MIN_SIZE) return null;
      src = img.currentSrc || img.src;
    }
    return { src: src, caption: caption(img) };
  }

  function caption(img) {
    var alt = (img.getAttribute('alt') || '').trim();
    if (alt) return alt;
    var box = img.closest('.img-float-left, .img-float-right, figure');
    return box ? box.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function mark() {
    document.querySelectorAll('.gallery img, .single img').forEach(function (img) {
      img.classList.toggle('is-zoomable', !!candidate(img));
    });
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Viewer

  var dialog, image, captionEl, count, prev, next;
  var items = [];
  var index = 0;

  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    dialog.setAttribute('aria-label', 'Image viewer');
    dialog.innerHTML =
      '<figure class="lightbox__figure">' +
        '<img class="lightbox__image" alt="">' +
        '<figcaption class="lightbox__caption"></figcaption>' +
      '</figure>' +
      '<p class="lightbox__count" aria-live="polite"></p>' +
      '<button type="button" class="lightbox__prev" aria-label="Previous image">&#8249;</button>' +
      '<button type="button" class="lightbox__next" aria-label="Next image">&#8250;</button>' +
      '<button type="button" class="lightbox__close" aria-label="Close">&#215;</button>';
    document.body.appendChild(dialog);

    image = dialog.querySelector('.lightbox__image');
    captionEl = dialog.querySelector('.lightbox__caption');
    count = dialog.querySelector('.lightbox__count');
    prev = dialog.querySelector('.lightbox__prev');
    next = dialog.querySelector('.lightbox__next');

    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    dialog.querySelector('.lightbox__close').addEventListener('click', close);
    dialog.addEventListener('close', function () {
      document.documentElement.classList.remove('lightbox-open');
      image.removeAttribute('src');
    });
    // A click on the backdrop (the dialog itself, not its contents) closes.
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) close();
    });
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
    });

    var startX = null;
    dialog.addEventListener('pointerdown', function (e) { startX = e.clientX; });
    dialog.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    });
  }

  function show(i) {
    index = (i + items.length) % items.length;
    var item = items[index];
    image.src = item.src;
    image.alt = item.caption;
    captionEl.textContent = item.caption;
    captionEl.hidden = !item.caption;
    count.textContent = (index + 1) + ' / ' + items.length;
    prev.hidden = next.hidden = items.length < 2;
    // Warm the neighbours so stepping feels instant.
    [1, -1].forEach(function (d) {
      if (items.length > 1) new Image().src = items[(index + d + items.length) % items.length].src;
    });
  }

  function step(delta) {
    if (items.length > 1) show(index + delta);
  }

  function open(img) {
    if (!dialog) build();
    var imgs = Array.prototype.slice.call(document.querySelectorAll('.is-zoomable'));
    items = imgs.map(candidate).filter(Boolean);
    var start = imgs.filter(function (el) { return candidate(el); }).indexOf(img);
    show(Math.max(0, start));
    document.documentElement.classList.add('lightbox-open');
    if (!dialog.open) dialog.showModal();
  }

  function close() {
    if (dialog && dialog.open) dialog.close();
  }

  // Capture phase, so the viewer wins over the image's link and the
  // theme's ajax navigation.
  document.addEventListener('click', function (e) {
    var img = e.target.closest && e.target.closest('img.is-zoomable');
    if (!img || !candidate(img)) return;
    e.preventDefault();
    e.stopPropagation();
    open(img);
  }, true);

  // Images that finish loading later may become zoomable (size is known).
  document.addEventListener('load', function (e) {
    if (e.target.tagName === 'IMG') mark();
  }, true);

  mark();
  var page = document.querySelector('.page');
  if (page) new MutationObserver(mark).observe(page, { childList: true, subtree: true });
})();
