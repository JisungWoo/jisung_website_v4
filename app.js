(function () {
  const state = window.__PORTFOLIO__;

  if (!state?.site || !state?.shared) {
    console.warn("Portfolio payload missing.");
    return;
  }

  const root = document.documentElement;
  const body = document.body;
  const { site, shared } = state;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const themeButtons = [...document.querySelectorAll("[data-set-theme]")];
  const nav = document.querySelector(".site-nav");
  const menuToggle = document.querySelector(".menu-toggle");
  const modalLayer = document.querySelector(".modal-layer");
  const modalContent = modalLayer?.querySelector(".modal-content") ?? null;
  const lightboxLayer = document.querySelector(".lightbox-layer");
  const lightboxImage = lightboxLayer?.querySelector("img") ?? null;
  const lightboxCaption = lightboxLayer?.querySelector("figcaption") ?? null;
  const copyButton = document.querySelector("[data-copy-email]");
  const copyStatus = document.querySelector(".copy-status");
  const heroStage = document.querySelector("[data-hero-stage]");
  const revealElements = [...document.querySelectorAll(".reveal")];
  const projectMap = new Map((site.modalProjects ?? []).map((project) => [project.id, project]));
  const storageKey = "portfolio-theme";

  let activeProject = null;
  let activeScreenshotIndex = 0;
  let lastTrigger = null;
  let releaseModalFocus = function () {};
  let releaseLightboxFocus = function () {};

  const readSavedTheme = () => {
    try {
      const storedTheme = window.localStorage.getItem(storageKey);
      if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
    } catch (error) {
      console.warn("Theme storage unavailable.", error);
    }
    return root.dataset.theme === "dark" ? "dark" : "light";
  };

  const applyTheme = (theme, persist = true) => {
    const safeTheme = theme === "dark" ? "dark" : "light";
    root.setAttribute("data-theme", safeTheme);
    themeButtons.forEach((button) => {
      const isActive = button.dataset.setTheme === safeTheme;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (!persist) return;

    try {
      window.localStorage.setItem(storageKey, safeTheme);
    } catch (error) {
      console.warn("Theme could not be persisted.", error);
    }
  };

  applyTheme(readSavedTheme(), false);

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => applyTheme(button.dataset.setTheme));
  });

  if (prefersReducedMotion) {
    body.classList.add("reduce-motion");
  }

  if (!prefersReducedMotion && revealElements.length && "IntersectionObserver" in window) {
    body.classList.add("motion-ready");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -10% 0px" }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  menuToggle?.addEventListener("click", () => {
    if (!nav) return;
    const open = nav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      menuToggle?.setAttribute("aria-expanded", "false");
    });
  });

  const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  const scrollToHash = (hash, behavior = prefersReducedMotion ? "auto" : "smooth") => {
    if (!hash || hash === "#") return;

    const target = document.querySelector(hash);
    if (!(target instanceof HTMLElement)) return;

    const navOffset = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navOffset - 24;
    window.scrollTo({ top: Math.max(top, 0), behavior });
  };

  const updateActiveNav = () => {
    if (!navLinks.length) return;

    let currentSection = null;
    sections.forEach((section) => {
      if (window.scrollY >= section.offsetTop - 140) {
        currentSection = section;
      }
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      link.classList.toggle("is-active", Boolean(currentSection) && href === `#${currentSection.id}`);
    });
  };

  window.addEventListener("scroll", updateActiveNav, { passive: true });
  updateActiveNav();

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!(target instanceof HTMLElement)) return;

      event.preventDefault();
      window.history.pushState(null, "", href);
      scrollToHash(href);

      if (nav?.contains(link)) {
        nav.classList.remove("is-open");
        menuToggle?.setAttribute("aria-expanded", "false");
      }
    });
  });

  window.addEventListener("hashchange", () => scrollToHash(window.location.hash, prefersReducedMotion ? "auto" : "smooth"));

  if (window.location.hash) {
    window.setTimeout(() => scrollToHash(window.location.hash, "auto"), 60);
  }

  if (heroStage && !prefersReducedMotion) {
    const updateHeroStage = () => {
      const y = Math.min(window.scrollY, 420);
      heroStage.style.transform = `translateY(${y * -0.04}px)`;
    };

    window.addEventListener("scroll", updateHeroStage, { passive: true });
    updateHeroStage();
  }

  document.querySelectorAll(".accordion-toggle").forEach((toggle) => {
    const label = toggle.querySelector("span");
    const icon = toggle.lastElementChild;
    const panel = toggle.nextElementSibling;

    if (!(panel instanceof HTMLElement)) return;

    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (label) label.textContent = site.ui.openDetails;
    if (icon) icon.textContent = "+";

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      if (label) label.textContent = expanded ? site.ui.openDetails : site.ui.closeDetails;
      if (icon) icon.textContent = expanded ? "+" : "-";
      panel.hidden = expanded;
    });
  });

  copyButton?.addEventListener("click", async () => {
    const statusDuration = 2200;

    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable.");
      await navigator.clipboard.writeText(site.contact.email);
      copyStatus?.classList.add("is-visible");
      window.setTimeout(() => copyStatus?.classList.remove("is-visible"), statusDuration);
    } catch (error) {
      console.warn("Copy failed.", error);
      copyStatus?.classList.add("is-visible");
    }
  });

  const focusable = (container) =>
    [...container.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')].filter(
      (element) => !element.hasAttribute("disabled")
    );

  const trapFocus = (layer) => {
    const items = focusable(layer);
    if (!items.length) return function () {};

    const first = items[0];
    const last = items[items.length - 1];

    first.focus();

    const handleKeydown = (event) => {
      if (event.key !== "Tab") return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    layer.addEventListener("keydown", handleKeydown);
    return () => layer.removeEventListener("keydown", handleKeydown);
  };

  const renderModalProject = (project) => {
    if (!modalContent) return;

    const screenshots = Array.isArray(project.screenshots) && project.screenshots.length
      ? `
      <div class="modal-gallery">
        <p class="eyebrow">${site.ui.viewScreenshots}</p>
        <div class="screenshot-grid">
          ${project.screenshots
            .map(
              (src, index) => `
            <button type="button" data-open-screenshot="${index}">
              <img src="${src}" alt="${site.ui.screenshot} ${index + 1}" />
            </button>`
            )
            .join("")}
        </div>
      </div>`
      : "";

    const links = Array.isArray(project.links) && project.links.length
      ? `<div class="modal-links">${project.links
          .map((link) => {
            const external = /^https?:/i.test(link.url);
            const target = external ? ' target="_blank" rel="noreferrer"' : "";
            const download = link.download ? " download" : "";
            return `<a class="link-chip" href="${link.url}"${target}${download}>${link.label}</a>`;
          })
          .join("")}</div>`
      : "";

    modalContent.innerHTML = `
      <header class="modal-header">
        <div class="tag-row">${project.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
        <h3 id="modal-title">${project.title}</h3>
        <p>${project.meta}</p>
        <p class="modal-copy">${project.summary}</p>
      </header>
      <div class="modal-media-pair">
        <img class="${project.containFirstImage ? "contain" : ""}" src="${project.imagePair[0]}" alt="${project.title}" />
        <img class="${project.containSecondImage ? "contain" : ""}" src="${project.imagePair[1]}" alt="${project.title}" />
      </div>
      ${screenshots}
      <ul class="modal-bullets">${project.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>
      ${links}`;

    modalContent.querySelectorAll("[data-open-screenshot]").forEach((button) => {
      button.addEventListener("click", () => openLightbox(Number(button.dataset.openScreenshot)));
    });
  };

  const openModal = (projectId, trigger) => {
    if (!modalLayer || !modalContent) return;

    const project = projectMap.get(projectId);
    if (!project) return;

    activeProject = project;
    lastTrigger = trigger ?? null;
    renderModalProject(project);
    modalLayer.hidden = false;
    body.style.overflow = "hidden";
    releaseModalFocus = trapFocus(modalLayer);
  };

  const closeModal = () => {
    if (!modalLayer || !modalContent) return;

    modalLayer.hidden = true;
    body.style.overflow = "";
    releaseModalFocus();
    modalContent.innerHTML = "";
    activeProject = null;
    lastTrigger?.focus?.();
  };

  const renderLightbox = () => {
    if (!lightboxImage || !lightboxCaption || !activeProject?.screenshots?.length) return;

    const src = activeProject.screenshots[activeScreenshotIndex];
    if (!src) return;

    lightboxImage.src = src;
    lightboxCaption.textContent = `${activeScreenshotIndex + 1} / ${activeProject.screenshots.length}`;
  };

  const openLightbox = (index) => {
    if (!lightboxLayer || !activeProject?.screenshots?.length) return;

    activeScreenshotIndex = index ?? 0;
    lightboxLayer.hidden = false;
    renderLightbox();
    releaseLightboxFocus = trapFocus(lightboxLayer);
  };

  const closeLightbox = () => {
    if (!lightboxLayer) return;
    lightboxLayer.hidden = true;
    releaseLightboxFocus();
  };

  document.querySelectorAll("[data-open-project]").forEach((button) => {
    button.addEventListener("click", () => openModal(button.dataset.openProject, button));
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.querySelectorAll("[data-close-lightbox]").forEach((button) => {
    button.addEventListener("click", closeLightbox);
  });

  document.querySelectorAll("[data-lightbox-step]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!activeProject?.screenshots?.length) return;
      const step = Number(button.dataset.lightboxStep);
      activeScreenshotIndex =
        (activeScreenshotIndex + step + activeProject.screenshots.length) % activeProject.screenshots.length;
      renderLightbox();
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (lightboxLayer && !lightboxLayer.hidden) closeLightbox();
      else if (modalLayer && !modalLayer.hidden) closeModal();
    }

    if (!lightboxLayer || lightboxLayer.hidden || !activeProject?.screenshots?.length) return;

    if (event.key === "ArrowRight") {
      activeScreenshotIndex = (activeScreenshotIndex + 1) % activeProject.screenshots.length;
      renderLightbox();
    }

    if (event.key === "ArrowLeft") {
      activeScreenshotIndex =
        (activeScreenshotIndex - 1 + activeProject.screenshots.length) % activeProject.screenshots.length;
      renderLightbox();
    }
  });

  console.info("Portfolio loaded:", site.languageCode, shared.year);
})();
