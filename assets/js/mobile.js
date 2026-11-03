// Phones only: the markup mobile.css needs (scroll hint, ruler, dock) and
// the motion that follows the finger. Everything stays off on wider
// screens; crossing the breakpoint reloads so neither layout inherits
// the other's state.
(() => {
  const phone = window.matchMedia("(max-width: 640px)");
  phone.addEventListener("change", () => window.location.reload());
  if (!phone.matches) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const pad2 = (n) => String(n).padStart(2, "0");

  const hero = document.getElementById("home");
  const list = document.getElementById("idxList");
  const items = list ? Array.from(list.querySelectorAll(".idx-item")) : [];
  const shown = () => items.filter((li) => !li.classList.contains("is-hidden"));

  // ---- hero: a quiet cue that scrolling does something here
  let hint = null;
  const heroCopy = hero && hero.querySelector(".hero-copy");
  if (heroCopy && !reduce) {
    hint = document.createElement("p");
    hint.className = "m-hint";
    hint.setAttribute("aria-hidden", "true");
    hint.innerHTML = "<i></i>Scroll to bring the plates into register";
    heroCopy.appendChild(hint);
  }

  // ---- work rail: ruler, project name and count under it
  let needle = null;
  let railName = null;
  let railNum = null;
  let canvas = null;
  if (list) {
    const ruler = document.createElement("div");
    ruler.className = "m-ruler";
    ruler.setAttribute("aria-hidden", "true");
    ruler.innerHTML =
      '<div class="m-ruler-track"><canvas></canvas><span class="m-needle"></span></div>' +
      '<div class="m-ruler-meta"><span class="m-name"></span><span class="m-num"></span></div>';
    list.closest(".idx").after(ruler);
    canvas = ruler.querySelector("canvas");
    needle = ruler.querySelector(".m-needle");
    railName = ruler.querySelector(".m-name");
    railNum = ruler.querySelector(".m-num");
  }

  const drawRuler = () => {
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    const g = canvas.getContext("2d");
    g.scale(dpr, dpr);
    g.fillStyle = "#c4c7cc";
    const step = r.width / 100;
    for (let i = 0; i <= 100; i++) {
      const h = i % 10 === 0 ? r.height : i % 5 === 0 ? r.height * 0.6 : r.height * 0.35;
      g.fillRect(Math.round(i * step), r.height - h, 1, h);
    }
  };

  // Neighbours recede and each image drifts against the swipe, so the
  // rail reads as plates sliding under a fixed frame.
  const railFrame = () => {
    const vis = shown();
    if (!vis.length) return;
    const anchor = list.getBoundingClientRect().left + parseFloat(getComputedStyle(list).scrollPaddingLeft || 0);
    let best = 0;
    let bestD = Infinity;
    vis.forEach((li, i) => {
      const r = li.getBoundingClientRect();
      const d = (r.left - anchor) / r.width;
      if (Math.abs(d) < bestD) {
        bestD = Math.abs(d);
        best = i;
      }
      if (reduce) return;
      const a = clamp(Math.abs(d));
      li.style.transform = `scale(${(1 - a * 0.06).toFixed(4)})`;
      li.style.opacity = (1 - a * 0.45).toFixed(3);
      const img = li.querySelector(".idx-rowfig");
      if (img) img.style.transform = `translateX(${(clamp(d, -1.5, 1.5) * -9).toFixed(2)}%)`;
    });
    items.forEach((li) => li.classList.toggle("is-current", li === vis[best]));
    const max = list.scrollWidth - list.clientWidth;
    const sp = max > 0 ? list.scrollLeft / max : 0;
    needle.style.transform = `translateX(${(sp * (needle.parentElement.clientWidth - 1)).toFixed(1)}px)`;
    railName.innerHTML = `<b>${vis[best].querySelector(".idx-title").textContent}</b>`;
    railNum.textContent = `${pad2(best + 1)} / ${pad2(vis.length)}`;
  };

  if (list) {
    list.addEventListener("scroll", () => requestAnimationFrame(railFrame), { passive: true });

    // script.js does the filtering; here the rail rewinds and the plates
    // that are left slide in one after another
    const facets = document.getElementById("facets");
    if (facets) {
      facets.addEventListener("click", (e) => {
        if (!e.target.closest(".facet")) return;
        requestAnimationFrame(() => {
          list.scrollTo({ left: 0 });
          if (!reduce) {
            shown().forEach((li, i) => {
              li.animate(
                [{ opacity: 0, translate: "40px 0" }, { opacity: 1, translate: "0 0" }],
                { duration: 550, delay: 45 * i, easing: "cubic-bezier(.16,1,.3,1)" }
              );
            });
          }
          railFrame();
        });
      });
    }

    // Tapping a plate opens its image to the full screen, then the page
    // turns to the case study.
    list.addEventListener("click", (e) => {
      const row = e.target.closest(".idx-row");
      if (!row || reduce || e.metaKey || e.ctrlKey) return;
      const img = row.querySelector(".idx-rowfig");
      if (!img || !img.complete) return;
      e.preventDefault();
      const from = row.getBoundingClientRect();
      const flyer = img.cloneNode();
      flyer.className = "m-flyer";
      flyer.removeAttribute("loading");
      Object.assign(flyer.style, {
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
        height: `${from.height}px`,
      });
      const veil = document.createElement("div");
      veil.className = "m-veil";
      document.body.append(flyer, veil);
      const fly = flyer.animate(
        [
          { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` },
          { left: "0px", top: "0px", width: `${window.innerWidth}px`, height: `${window.innerHeight}px` },
        ],
        { duration: 560, easing: "cubic-bezier(.7,0,.15,1)", fill: "forwards" }
      );
      fly.finished.then(() => {
        veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out", fill: "forwards" })
          .finished.then(() => { window.location.href = row.href; });
      });
    });

    // Back from a case study: the bfcache restores the page as we left it
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) document.querySelectorAll(".m-flyer, .m-veil").forEach((el) => el.remove());
    });
  }

  // ---- How I work: one word at a time fills with ink
  const kicker = document.querySelector(".principles-kicker");
  let words = [];
  if (kicker) {
    kicker.innerHTML = kicker.textContent
      .trim()
      .split(/\s+/)
      .map((w) => `<span class="m-w">${w}</span>`)
      .join(" ");
    words = Array.from(kicker.children);
  }

  const mail = document.querySelector(".contact-link--primary");

  // ---- dock
  const sections = ["work", "about", "contact"].filter((id) => document.getElementById(id));
  const dock = document.createElement("nav");
  dock.className = "m-dock";
  dock.setAttribute("aria-label", "Sections");
  dock.innerHTML =
    '<span class="m-dock-pill"></span>' +
    sections.map((id) => `<a href="#${id}" data-s="${id}">${id}</a>`).join("");
  document.body.appendChild(dock);
  const pill = dock.querySelector(".m-dock-pill");
  const links = Array.from(dock.querySelectorAll("a"));
  let active = null;
  const setActive = (id) => {
    if (id === active) return;
    active = id;
    links.forEach((a) => {
      const on = a.dataset.s === id;
      a.classList.toggle("is-on", on);
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    const a = links.find((l) => l.dataset.s === id);
    if (a) {
      pill.style.width = `${a.offsetWidth}px`;
      pill.style.transform = `translateX(${a.offsetLeft - 4}px)`;
      pill.style.opacity = "1";
    } else {
      pill.style.opacity = "0";
    }
  };

  // ---- one loop for everything that follows the page scroll
  let ticking = false;
  const frame = () => {
    ticking = false;
    const vh = window.innerHeight;
    if (hero) {
      const hr = hero.getBoundingClientRect();
      if (hint) hint.style.opacity = window.scrollY > 24 ? "0" : "1";
      dock.classList.toggle("is-shown", hr.bottom < vh * 0.6);
    } else {
      dock.classList.add("is-shown");
    }

    if (words.length) {
      const r = kicker.getBoundingClientRect();
      const lit = reduce ? words.length : Math.round(clamp((vh * 0.82 - r.top) / (r.height + vh * 0.35)) * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < lit));
    }

    if (mail) mail.classList.toggle("is-lit", mail.getBoundingClientRect().top < vh * 0.8);

    const probe = vh * 0.45;
    let cur = null;
    sections.forEach((id) => {
      const r = document.getElementById(id).getBoundingClientRect();
      if (r.top < probe && r.bottom > probe) cur = id;
    });
    if (vh + window.scrollY >= document.documentElement.scrollHeight - 4) cur = sections[sections.length - 1];
    setActive(cur);
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(frame);
    }
  }, { passive: true });

  const relayout = () => {
    drawRuler();
    if (list) railFrame();
    frame();
  };
  window.addEventListener("resize", relayout);
  window.addEventListener("load", relayout);
  relayout();
})();
