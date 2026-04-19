(function () {
  'use strict';

  function Flipbook(el, images, opts) {
    this.root = typeof el === 'string' ? document.querySelector(el) : el;
    this.images = images;
    this.opts = Object.assign(
      {
        maxShadowOpacity: 0.3,
        showCover: true,
        flippingTime: 800,
        lazy: true,
        rtl: false,
      },
      opts
    );
    this.flip = null;
    this._started = false;
    this._loaded = 0;
    this._build();
    if (this.opts.lazy) this._observe();
    else this._start();
  }

  Flipbook.prototype._build = function () {
    this.root.classList.add('flipbook');
    if (this.opts.rtl) this.root.classList.add('flipbook--rtl');

    this.root.innerHTML =
      '<div class="flipbook-stage">' +
        '<div class="flipbook-loader">' +
          '<div class="flipbook-progress"><div class="flipbook-progress-bar"></div></div>' +
          '<p class="flipbook-loader-text">Loading pages\u2026</p>' +
        '</div>' +
        '<div class="flipbook-book"></div>' +
      '</div>' +
      '<div class="flipbook-controls" style="display:none">' +
        '<button class="flipbook-btn flipbook-next" type="button" aria-label="Next page">' +
          '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.5 15L7.5 10L12.5 5"/></svg>' +
        '</button>' +
        '<span class="flipbook-counter"></span>' +
        '<button class="flipbook-btn flipbook-prev" type="button" aria-label="Previous page">' +
          '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 5L12.5 10L7.5 15"/></svg>' +
        '</button>' +
      '</div>';

    this.$stage   = this.root.querySelector('.flipbook-stage');
    this.$loader  = this.root.querySelector('.flipbook-loader');
    this.$bar     = this.root.querySelector('.flipbook-progress-bar');
    this.$text    = this.root.querySelector('.flipbook-loader-text');
    this.$book    = this.root.querySelector('.flipbook-book');
    this.$ctrls   = this.root.querySelector('.flipbook-controls');
    this.$counter = this.root.querySelector('.flipbook-counter');
    this.$prev    = this.root.querySelector('.flipbook-prev');
    this.$next    = this.root.querySelector('.flipbook-next');
  };

  Flipbook.prototype._observe = function () {
    var self = this;
    var obs = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting && !self._started) {
          self._started = true;
          obs.disconnect();
          self._start();
        }
      },
      { rootMargin: '300px' }
    );
    obs.observe(this.root);
  };

  Flipbook.prototype._start = function () {
    var self = this;
    this._preloadImages()
      .then(function (entries) {
        self._initFlip(entries);
        self._bind();
        self._reveal();
      })
      .catch(function (err) {
        self.$text.textContent = 'Could not load images.';
        console.error('[Flipbook]', err);
      });
  };

  Flipbook.prototype._preloadImages = function () {
    var self = this;
    var srcs = this.images;
    var total = srcs.length;

    var promises = srcs.map(function (src, i) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () {
          self._loaded++;
          self.$bar.style.width = ((self._loaded / total) * 100).toFixed(1) + '%';
          self.$text.textContent = 'Loading page ' + self._loaded + ' of ' + total + '\u2026';
          resolve({ src: src, w: img.naturalWidth, h: img.naturalHeight });
        };
        img.onerror = function () {
          reject(new Error('Failed to load ' + src));
        };
        img.src = src;
      });
    });

    return Promise.all(promises);
  };

  Flipbook.prototype._initFlip = function (entries) {
    var baseW = entries[0].w;
    var baseH = entries[0].h;
    var spreadAR = (2 * baseW) / baseH;
    this.$stage.style.aspectRatio = String(spreadAR);

    var total = entries.length;
    this._total = total;

    for (var i = 0; i < total; i++) {
      var div = document.createElement('div');
      div.className = 'flipbook-page';
      if (i === 0 || i === total - 1) div.dataset.density = 'hard';
      var img = document.createElement('img');
      img.src = entries[i].src;
      img.alt = 'Page ' + (i + 1);
      img.draggable = false;
      div.appendChild(img);
      this.$book.appendChild(div);
    }

    var isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    this.flip = new St.PageFlip(this.$book, {
      width: baseW,
      height: baseH,
      size: 'stretch',
      maxShadowOpacity: isMobile ? 0.2 : this.opts.maxShadowOpacity,
      showCover: this.opts.showCover,
      mobileScrollSupport: false,
      swipeDistance: 20,
      flippingTime: isMobile ? 600 : this.opts.flippingTime,
      useMouseEvents: true,
      autoSize: true,
      drawShadow: true,
      showPageCorners: !isMobile,
    });

    this.flip.loadFromHTML(this.$book.querySelectorAll('.flipbook-page'));
  };

  Flipbook.prototype._bind = function () {
    var self = this;
    this.$prev.addEventListener('click', function () {
      self.flip.flipPrev();
    });
    this.$next.addEventListener('click', function () {
      self.flip.flipNext();
    });

    this.flip.on('flip', function () {
      self._updateUI();
    });

    document.addEventListener('keydown', function (e) {
      if (!self._inView()) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        self.flip.flipPrev();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        self.flip.flipNext();
      }
    });

    this._updateUI();
  };

  Flipbook.prototype._updateUI = function () {
    if (!this.flip) return;
    var idx = this.flip.getCurrentPageIndex();
    var total = this._total;
    this.$counter.textContent = (idx + 1) + '\u2009/\u2009' + total;
    this.$prev.disabled = idx <= 0;
    this.$next.disabled = idx >= total - 1;
  };

  Flipbook.prototype._reveal = function () {
    this.$loader.classList.add('is-hidden');
    this.$ctrls.style.display = '';
  };

  Flipbook.prototype._inView = function () {
    var r = this.root.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  };

  window.Flipbook = Flipbook;
})();
