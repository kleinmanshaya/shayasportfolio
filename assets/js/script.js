const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    siteNav.classList.toggle("active");
  });

  const navLinks = siteNav.querySelectorAll("a");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("active");
    });
  });
}

const contactForm = document.querySelector(".contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Thanks! Your form is ready to connect to a backend.");
  });
}

// Scroll reveal animations
const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && revealElements.length) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  revealElements.forEach((el) => observer.observe(el));
} else {
  // Fallback: show all immediately
  revealElements.forEach((el) => el.classList.add("visible"));
}

// Header style on scroll
const header = document.querySelector(".site-header");

if (header) {
  const updateHeader = () => {
    if (window.scrollY > 10) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

// Typewriter for hero title
const typeTargets = Array.from(document.querySelectorAll(".type-target"));

if (typeTargets.length) {
  typeTargets.forEach((el) => {
    const initial = (el.dataset.text || "").toUpperCase();
    el.dataset.text = initial;
    el.textContent = "";
  });

  let currentIndex = 0;

  const typeNext = () => {
    if (currentIndex >= typeTargets.length) return;
    const el = typeTargets[currentIndex];
    const text = el.dataset.text || "";
    let i = 0;

    const step = () => {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        i += 1;
        setTimeout(step, 75);
      } else {
        currentIndex += 1;
        setTimeout(typeNext, 200);
      }
    };

    step();
  };

  // Start after the hero-name CSS animation has settled
  window.setTimeout(typeNext, 700);
}

// Highlights slider
const slider = document.querySelector("[data-slider]");

if (slider) {
  const slides = Array.from(slider.querySelectorAll(".highlights-slide"));
  const dots = Array.from(slider.querySelectorAll(".highlights-dot"));
  const prevBtn = slider.querySelector(".highlights-arrow-prev");
  const nextBtn = slider.querySelector(".highlights-arrow-next");

  let index = 0;

  const setIndex = (newIndex) => {
    const prevIndex = index;
    const nextIndex = (newIndex + slides.length) % slides.length;

    if (nextIndex === prevIndex) return;

    const prevSlide = slides[prevIndex];
    const nextSlide = slides[nextIndex];

    index = nextIndex;
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === index);
    });

    // Incoming slide: place above viewport, then add is-active so it slides down
    if (nextSlide) {
      nextSlide.classList.add("is-active");
    }
    // Leaving slide: animate down and remove state after transition
    if (prevSlide) {
      prevSlide.classList.remove("is-active");
      prevSlide.classList.add("is-leaving");
      prevSlide.addEventListener(
        "transitionend",
        function cleanup(e) {
          if (e.target !== prevSlide || e.propertyName !== "transform") return;
          prevSlide.classList.remove("is-leaving");
          prevSlide.removeEventListener("transitionend", cleanup);
        },
        { once: true }
      );
    }
  };

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => setIndex(index - 1));
    nextBtn.addEventListener("click", () => setIndex(index + 1));
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const i = Number(dot.dataset.dotIndex || 0);
      setIndex(i);
    });
  });

  // optional auto-advance (2s)
  const AUTO_INTERVAL = 2000;
  let auto = window.setInterval(() => setIndex(index + 1), AUTO_INTERVAL);

  slider.addEventListener("mouseenter", () => {
    window.clearInterval(auto);
  });

  slider.addEventListener("mouseleave", () => {
    auto = window.setInterval(() => setIndex(index + 1), AUTO_INTERVAL);
  });
}

// Lightbox: project galleries, homepage highlights, and project cards
const galleryData = [];
const galleryElements = [];
const galleryContainers = [];

document.querySelectorAll(".project-media").forEach((gallery) => {
  const items = Array.from(gallery.querySelectorAll(".media-block"));
  galleryData.push(
    items.map((item) => {
      const img = item.querySelector("img");
      return {
        src: img ? img.getAttribute("src") || "" : "",
        alt: img ? img.getAttribute("alt") || "" : "",
        caption: img ? img.getAttribute("alt") || "" : "",
      };
    })
  );
  galleryElements.push(items);
  galleryContainers.push(gallery);
});

const highlightsSlider = document.querySelector("[data-slider]");
if (highlightsSlider) {
  const slides = Array.from(highlightsSlider.querySelectorAll(".highlights-slide"));
  galleryData.push(
    slides.map((slide) => {
      const a = slide.querySelector(".highlight-item");
      const img = a ? a.querySelector("img") : null;
      const src = img ? (img.getAttribute("src") || img.src || "") : "";
      return {
        src: src ? (src.startsWith("http") || src.startsWith("/") ? src : new URL(src, window.location.href).href) : "",
        alt: img ? img.getAttribute("alt") || "" : "",
        caption: img ? (img.getAttribute("alt") || "") : "",
      };
    })
  );
  galleryElements.push(
    slides.map((slide) => slide.querySelector(".highlight-item")).filter(Boolean)
  );
  galleryContainers.push(null);
}

const projectFiles = document.querySelector(".project-files");
if (projectFiles) {
  const cards = Array.from(projectFiles.querySelectorAll(".project-card"));
  galleryData.push(
    cards.map((card) => {
      const img = card.querySelector(".project-file-cover");
      const name = card.querySelector(".project-file-name");
      return {
        src: img ? img.getAttribute("src") || "" : "",
        alt: img ? img.getAttribute("alt") || "" : "",
        caption: name ? name.textContent.trim() : "",
      };
    })
  );
  galleryElements.push(
    cards.map((card) => card.querySelector(".project-file-cover-wrap")).filter(Boolean)
  );
  galleryContainers.push(null);
}

if (galleryData.length > 0) {
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `
    <div class="lightbox-inner">
      <button class="lightbox-close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="lightbox-carousel">
        <div class="lightbox-track-wrap">
          <div class="lightbox-track"></div>
        </div>
        <div class="lightbox-nav">
          <button class="lightbox-arrow lightbox-prev" type="button" aria-label="Previous image" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button class="lightbox-arrow lightbox-next" type="button" aria-label="Next image">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div class="lightbox-indicators"></div>
      </div>
      <div class="lightbox-caption">
        <span class="lightbox-caption-main"></span>
        <span class="lightbox-counter"></span>
      </div>
    </div>
  `;

  document.body.appendChild(lightbox);

  const closeBtn = lightbox.querySelector(".lightbox-close");
  const prevBtn = lightbox.querySelector(".lightbox-prev");
  const nextBtn = lightbox.querySelector(".lightbox-next");
  const trackEl = lightbox.querySelector(".lightbox-track");
  const trackWrapEl = lightbox.querySelector(".lightbox-track-wrap");
  const indicatorsEl = lightbox.querySelector(".lightbox-indicators");
  const carouselEl = lightbox.querySelector(".lightbox-carousel");
  const captionEl = lightbox.querySelector(".lightbox-caption-main");
  const counterEl = lightbox.querySelector(".lightbox-counter");

  let currentGalleryIndex = 0;
  let currentImageIndex = 0;
  let currentImages = [];

  // Drag state
  let isDragging = false;
  let dragMoved = false;
  let dragStartX = 0;
  let dragCurrentX = 0;

  const getSlideWidth = () => trackWrapEl.offsetWidth;

  const buildCarousel = (galleryIdx) => {
    currentImages = galleryData[galleryIdx];
    trackEl.innerHTML = "";
    indicatorsEl.innerHTML = "";

    const slideWidth = getSlideWidth();
    currentImages.forEach((imgData, i) => {
      const slide = document.createElement("div");
      slide.className = "lightbox-slide";
      slide.style.width = slideWidth + "px";
      slide.style.flexShrink = "0";
      const img = document.createElement("img");
      img.src = imgData.src;
      img.alt = imgData.alt || "";
      img.draggable = false;
      slide.appendChild(img);
      trackEl.appendChild(slide);

      const dot = document.createElement("button");
      dot.className = "lightbox-indicator" + (i === 0 ? " is-active" : "");
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to image ${i + 1}`);
      dot.addEventListener("click", () => goTo(i));
      indicatorsEl.appendChild(dot);
    });

    indicatorsEl.style.display = currentImages.length <= 1 ? "none" : "";
  };

  const updateUI = () => {
    const total = currentImages.length;
    const slideWidth = getSlideWidth();
    trackEl.style.transform = `translateX(-${currentImageIndex * slideWidth}px)`;
    const data = currentImages[currentImageIndex];
    captionEl.textContent = data.caption || data.alt || "";
    counterEl.textContent = `${currentImageIndex + 1} / ${total}`;
    prevBtn.disabled = currentImageIndex === 0;
    nextBtn.disabled = currentImageIndex === total - 1;
    indicatorsEl.querySelectorAll(".lightbox-indicator").forEach((dot, i) => {
      dot.classList.toggle("is-active", i === currentImageIndex);
    });
  };

  const goTo = (index) => {
    if (index < 0 || index >= currentImages.length) return;
    currentImageIndex = index;
    updateUI();
  };

  const showNext = () => goTo(currentImageIndex + 1);
  const showPrev = () => goTo(currentImageIndex - 1);

  const openLightbox = (galleryIndex, imageIndex) => {
    currentGalleryIndex = galleryIndex;
    currentImageIndex = imageIndex;
    const container = galleryContainers[galleryIndex];
    const isNorish = container?.closest?.(".project-page--norish");
    lightbox.classList.toggle("lightbox--norish", !!isNorish);

    // Build slides, then position without animation, then re-enable
    buildCarousel(galleryIndex);
    trackEl.style.transition = "none";
    updateUI();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        trackEl.style.transition = "";
      });
    });

    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  // ---- Drag / swipe support ----
  const onDragStart = (clientX) => {
    isDragging = true;
    dragMoved = false;
    dragStartX = clientX;
    dragCurrentX = clientX;
    trackEl.style.transition = "none";
  };

  const onDragMove = (clientX) => {
    if (!isDragging) return;
    dragCurrentX = clientX;
    const diff = dragCurrentX - dragStartX;
    if (Math.abs(diff) > 4) dragMoved = true;
    if (!dragMoved) return;
    const baseOffset = -currentImageIndex * trackWrapEl.offsetWidth;
    trackEl.style.transform = `translateX(${baseOffset + diff}px)`;
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    trackEl.style.transition = "";
    const diff = dragCurrentX - dragStartX;
    if (dragMoved) {
      if (diff <= -40 && currentImageIndex < currentImages.length - 1) {
        showNext();
      } else if (diff >= 40 && currentImageIndex > 0) {
        showPrev();
      } else {
        updateUI(); // snap back
      }
    }
    dragMoved = false;
  };

  trackWrapEl.addEventListener("mousedown", (e) => {
    e.preventDefault();
    onDragStart(e.clientX);
  });
  window.addEventListener("mousemove", (e) => { if (isDragging) onDragMove(e.clientX); });
  window.addEventListener("mouseup", () => { if (isDragging) onDragEnd(); });

  trackWrapEl.addEventListener("touchstart", (e) => {
    onDragStart(e.touches[0].clientX);
  }, { passive: true });
  trackWrapEl.addEventListener("touchmove", (e) => {
    onDragMove(e.touches[0].clientX);
  }, { passive: true });
  trackWrapEl.addEventListener("touchend", onDragEnd);

  // ---- Wire gallery click handlers ----
  galleryElements.forEach((elements, gIndex) => {
    elements.forEach((el, iIndex) => {
      if (!el) return;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openLightbox(gIndex, iIndex);
      });
    });
  });

  closeBtn.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  nextBtn.addEventListener("click", (e) => { e.stopPropagation(); showNext(); });
  prevBtn.addEventListener("click", (e) => { e.stopPropagation(); showPrev(); });

  window.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowRight") showNext();
    if (event.key === "ArrowLeft") showPrev();
  });

  window.addEventListener("resize", () => {
    if (!lightbox.classList.contains("is-open")) return;
    const slideWidth = getSlideWidth();
    trackEl.querySelectorAll(".lightbox-slide").forEach((s) => {
      s.style.width = slideWidth + "px";
    });
    trackEl.style.transition = "none";
    updateUI();
    requestAnimationFrame(() => { trackEl.style.transition = ""; });
  });
}

// Image loading placeholders
document.querySelectorAll(".media-block, .highlight-item").forEach((el) => {
  const img = el.querySelector("img");
  if (!img) return;
  const done = () => el.classList.add("is-loaded");
  if (img.complete && img.naturalWidth > 0) {
    done();
  } else {
    img.addEventListener("load", done);
    img.addEventListener("error", done);
  }
});