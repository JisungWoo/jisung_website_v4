import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { portfolioSite } from "../src/data/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const ensureDir = (target) => mkdirSync(target, { recursive: true });
const out = (...parts) => path.join(root, ...parts);
const safeJson = (value) =>
  JSON.stringify(value).replace(/</g, "\\u003C").replace(/>/g, "\\u003E").replace(/&/g, "\\u0026");

const iconSvg = (name) => {
  switch (name) {
    case "linkedin":
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.94 8.5V21H2.78V8.5h4.16ZM4.86 2C6.3 2 7.2 2.96 7.2 4.22c0 1.23-.88 2.22-2.3 2.22h-.03C3.49 6.44 2.6 5.45 2.6 4.22 2.6 2.96 3.52 2 4.86 2ZM21.4 13.3V21h-4.15v-7.21c0-1.81-.65-3.04-2.27-3.04-1.24 0-1.98.83-2.3 1.63-.12.29-.15.69-.15 1.09V21H8.38s.06-11.3 0-12.5h4.15v1.77c.55-.84 1.54-2.04 3.75-2.04 2.74 0 4.8 1.79 4.8 5.63Z"/></svg>`;
    case "github":
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5C5.65.5.5 5.7.5 12.12c0 5.13 3.3 9.48 7.9 11.01.58.11.79-.25.79-.57 0-.28-.01-1.03-.02-2.02-3.21.7-3.89-1.56-3.89-1.56-.52-1.35-1.28-1.7-1.28-1.7-1.05-.73.08-.72.08-.72 1.16.08 1.77 1.21 1.77 1.21 1.03 1.78 2.71 1.27 3.37.97.1-.76.4-1.27.73-1.57-2.56-.3-5.25-1.3-5.25-5.77 0-1.27.45-2.3 1.18-3.12-.12-.3-.51-1.53.11-3.18 0 0 .97-.31 3.18 1.19a10.9 10.9 0 0 1 5.8 0c2.2-1.5 3.17-1.2 3.17-1.2.63 1.66.24 2.9.12 3.19.74.82 1.18 1.85 1.18 3.12 0 4.48-2.7 5.46-5.28 5.76.41.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .32.21.69.8.57 4.6-1.53 7.89-5.88 7.89-11.01C23.5 5.7 18.35.5 12 .5Z"/></svg>`;
    case "resume":
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 2h8l4 4v16H6V2Zm8 1.5V7h3.5L14 3.5ZM8.5 10h7v1.5h-7V10Zm0 3h7v1.5h-7V13Zm0 3h5v1.5h-5V16Z"/></svg>`;
    default:
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".18"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>`;
  }
};

const inferActionIcon = (action) => {
  const label = `${action.label ?? ""} ${action.href ?? action.url ?? ""}`.toLowerCase();
  if (label.includes("linkedin")) return "linkedin";
  if (label.includes("github")) return "github";
  if (label.includes("resume") || action.download) return "resume";
  return "dot";
};

const renderSocialLinks = (actions = [], { className = "social-chip", iconOnly = false } = {}) =>
  actions
    .map((action) => {
      const iconName = inferActionIcon(action);
      const label = action.label ?? "";
      const content = iconOnly
        ? `${iconSvg(iconName)}<span class="sr-only">${label}</span>`
        : `${iconSvg(iconName)}<span>${label}</span>`;

      if (action.kind === "modal") {
        return `<button ${actionAttrs(action, className)} aria-label="${label}" title="${label}">${content}</button>`;
      }

      return `<a ${actionAttrs(action, className)} aria-label="${label}" title="${label}">${content}</a>`;
    })
    .join("");

const actionAttrs = (action, className = "link-chip") => {
  if (action.kind === "modal") {
    return `type="button" class="${className}" data-open-project="${action.projectId}"`;
  }

  const external = /^https?:/i.test(action.href);
  const target = external ? ' target="_blank" rel="noreferrer"' : "";
  const download = action.download ? " download" : "";
  return `href="${action.href}" class="${className}"${target}${download}`;
};

const renderActions = (actions = [], className = "link-chip") =>
  actions
    .map((action) =>
      action.kind === "modal"
        ? `<button ${actionAttrs(action, className)}>${action.label}</button>`
        : `<a ${actionAttrs(action, className)}>${action.label}</a>`
    )
    .join("");

const renderNav = (site, shared) => `
  <header class="site-header">
    <div class="nav-shell">
      <a class="brand-mark" href="#top" aria-label="${site.hero.name}">${site.hero.name}</a>
      <button class="menu-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="${site.ui.menu}">
        <span></span><span></span>
      </button>
      <nav id="site-nav" class="site-nav" aria-label="${site.ui.primaryNav}">
        <div class="nav-links">
          ${site.nav.map((item) => `<a href="${item.href}">${item.label}</a>`).join("")}
        </div>
        <div class="nav-utilities">
          <div class="nav-socials">
            ${renderSocialLinks(
              [
                { label: "LinkedIn", href: shared.linkedinHref },
                { label: "GitHub", href: shared.githubHref },
              ],
              { className: "social-icon-link", iconOnly: true }
            )}
          </div>
          <div class="theme-switch" role="group" aria-label="${site.ui.themeGroup}">
            <button type="button" class="theme-option is-active" data-set-theme="light" aria-pressed="true">${site.ui.themeLight}</button>
            <button type="button" class="theme-option" data-set-theme="dark" aria-pressed="false">${site.ui.themeDark}</button>
          </div>
          <a class="lang-pill" href="${site.localeSwitch.href}" hreflang="${site.localeSwitch.href.endsWith("index_kr.html") ? "ko" : "en"}" lang="${site.localeSwitch.href.endsWith("index_kr.html") ? "ko" : "en"}">${site.localeSwitch.label}</a>
        </div>
      </nav>
    </div>
  </header>`;

const renderHero = (site, shared) => `
  <section id="top" class="hero-section">
    <div class="hero-shell">
      <div class="hero-copy reveal">
        <p class="eyebrow">${site.hero.badge}</p>
        <p class="role-line">${site.hero.role}</p>
        <h1 class="display-name">${site.hero.name}</h1>
        <p class="hero-thesis">${site.hero.thesis}</p>
        <p class="hero-summary">${site.hero.summary}</p>
        <div class="hero-actions">
          <a class="cta-primary" href="${site.hero.primaryCta.href}" download>${site.hero.primaryCta.label}</a>
          <a class="cta-secondary" href="${site.hero.secondaryCta.href}">${site.hero.secondaryCta.label}</a>
        </div>
        <div class="metric-row">
          ${site.hero.metrics
            .map(
              (item) => `
            <div class="metric-chip">
              <strong>${item.value}</strong>
              <span>${item.label}</span>
            </div>`
            )
            .join("")}
        </div>
      </div>
      <div class="hero-visual reveal reveal-delay-2">
        <figure class="portrait-stage" data-hero-stage>
          <div class="portrait-frame">
            <img src="${shared.heroMedia.portrait}" alt="${site.hero.photoAlt ?? site.hero.photoCaption ?? site.hero.name}" />
          </div>
          ${site.hero.photoCaption ? `<figcaption class="portrait-caption">${site.hero.photoCaption}</figcaption>` : ""}
        </figure>
        <div class="hero-tags">
          ${site.hero.visualTags.map((tag) => `<span>${tag}</span>`).join("")}
        </div>
      </div>
    </div>
    <div class="brand-rail reveal reveal-delay-3">
      <p class="rail-label">${site.hero.logoLabel}</p>
      <div class="logo-track">
        ${shared.logos
          .map((logo) => `<div class="logo-item"><img src="${logo.src}" alt="${logo.alt}" /></div>`)
          .join("")}
      </div>
    </div>
  </section>`;

const renderAbout = (site) => {
  const focusLabel = site.languageCode === "ko" ? "현재 집중하는 영역" : "Current focus";

  return `
  <section id="about" class="about-section">
    <div class="section-head reveal">
      <p class="eyebrow">${site.about.eyebrow}</p>
      <h2 class="section-title">${site.about.title}</h2>
    </div>
    <div class="about-grid">
      <div class="about-copy reveal reveal-delay-1">
        ${site.about.body.map((paragraph) => `<p>${paragraph}</p>`).join("")}
      </div>
      <aside class="about-aside reveal reveal-delay-2">
        <p class="aside-label">${focusLabel}</p>
        <div class="aside-tags">
          ${site.hero.visualTags.map((tag) => `<span>${tag}</span>`).join("")}
        </div>
        <div class="about-actions">${renderActions(site.about.actions)}</div>
      </aside>
    </div>
  </section>`;
};

const renderPhilosophy = (site) => `
  <section id="philosophy" class="philosophy-section">
    <div class="philosophy-grid">
      <div class="section-head reveal">
        <p class="eyebrow">${site.philosophy.eyebrow}</p>
        <h2 class="section-title">${site.philosophy.title}</h2>
        <p class="section-copy">${site.philosophy.body}</p>
        <div class="tag-row philosophy-tags">
          ${site.philosophy.tags.map((tag) => `<span>${tag}</span>`).join("")}
        </div>
      </div>
      <aside class="piano-panel reveal reveal-delay-1">
        <p class="eyebrow">${site.philosophy.pianoTitle}</p>
        <p class="piano-copy">${site.philosophy.pianoBody}</p>
      </aside>
    </div>
    <div class="principle-rail">
      ${site.philosophy.items
        .map(
          (item, index) => `
        <article class="principle-line reveal reveal-delay-${(index % 3) + 1}">
          <span class="principle-number">${item.number}</span>
          <h3>${item.title}</h3>
          <p>${item.text}</p>
        </article>`
        )
        .join("")}
    </div>
  </section>`;

const renderWork = (site) => {
  const projectDetails = new Map((site.modalProjects ?? []).map((project) => [project.id, project]));
  const detailLabel = site.languageCode === "ko" ? "프로젝트 자세히 보기" : "Open project details";

  return `
  <section id="projects" class="work-section">
    <div class="section-head reveal">
      <p class="eyebrow">${site.work.eyebrow}</p>
      <h2 class="section-title">${site.work.title}</h2>
      <p class="section-copy">${site.work.body}</p>
    </div>
    <div class="spotlight-list">
      ${site.work.primaryProjects
        .map((project, index) => {
          return `
        <article class="project-spotlight ${project.tone} ${index % 2 === 1 ? "is-reversed" : ""} reveal reveal-delay-${(index % 3) + 1}">
          <div class="project-copy">
            <div class="tag-row">${project.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
            <h3>${project.title}</h3>
            <p class="project-meta">${project.meta}</p>
            <p class="project-summary">${project.summary}</p>
            <p class="project-lead">${project.lead}</p>
            <ul class="project-highlights">${project.highlights.map((item) => `<li>${item}</li>`).join("")}</ul>
            <div class="project-links">${renderActions(project.actions)}</div>
          </div>
        </article>`;
        })
        .join("")}
    </div>
    <div class="secondary-projects reveal">
      <p class="archive-label">${site.work.secondaryProjectsLabel}</p>
      <div class="secondary-project-grid">
        ${site.work.secondaryProjects
          .map((project, index) => {
            const detail = projectDetails.get(project.projectId);
            const bulletPreview = (detail?.bullets ?? []).slice(0, 2);
            const tagMarkup = (detail?.tags ?? []).slice(0, 3).map((tag) => `<span>${tag}</span>`).join("");
            const actions = [
              { label: detailLabel, kind: "modal", projectId: project.projectId },
              ...((detail?.links ?? []).map((link) => ({
                label: link.label,
                href: link.url,
                download: link.download,
              }))),
            ];

            return `
          <article class="secondary-project-card reveal reveal-delay-${(index % 3) + 1}">
            <div class="secondary-project-copy">
              ${tagMarkup ? `<div class="tag-row">${tagMarkup}</div>` : ""}
              <h3>${detail?.title ?? project.label}</h3>
              <p class="project-meta">${detail?.meta ?? project.meta}</p>
              <p class="project-summary">${detail?.summary ?? project.meta}</p>
              ${bulletPreview.length ? `<ul class="secondary-project-points">${bulletPreview.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
              <div class="project-links">${renderActions(actions)}</div>
            </div>
          </article>`;
          })
          .join("")}
      </div>
    </div>
  </section>`;
};

const renderExperience = (site) => `
  <section id="experience" class="experience-section">
    <div class="section-head reveal">
      <p class="eyebrow">${site.experience.eyebrow}</p>
      <h2 class="section-title">${site.experience.title}</h2>
      <p class="section-copy">${site.experience.intro}</p>
    </div>
    <div class="experience-list">
      ${site.experience.items
        .map(
          (item, index) => `
        <article class="experience-card reveal reveal-delay-${(index % 3) + 1}">
          <div class="experience-top">
            <div>
              <p class="experience-company">${item.company}</p>
              <h3>${item.role}</h3>
            </div>
            <div class="experience-meta">
              <span>${item.period}</span>
              <span>${item.location}</span>
            </div>
          </div>
          <p class="experience-summary">${item.summary}</p>
          <div class="tag-row">${item.chips.map((chip) => `<span>${chip}</span>`).join("")}</div>
          <button class="accordion-toggle" type="button" aria-expanded="true">
            <span>${site.ui.closeDetails}</span>
            <span aria-hidden="true">-</span>
          </button>
          <div class="accordion-panel">
            <ul>${item.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>
            ${item.detailLink ? `<a class="inline-link" href="${item.detailLink.href}" target="_blank" rel="noreferrer">${item.detailLink.label}</a>` : ""}
          </div>
        </article>`
        )
        .join("")}
    </div>
  </section>`;

const renderCapabilities = (site) => `
  <section id="capabilities" class="capabilities-section">
    <div class="section-head reveal">
      <p class="eyebrow">${site.capabilities.eyebrow}</p>
      <h2 class="section-title">${site.capabilities.title}</h2>
      ${site.capabilities.body ? `<p class="section-copy">${site.capabilities.body}</p>` : ""}
    </div>
    <div class="capability-columns">
      ${site.capabilities.groups
        .map(
          (group, index) => `
        <article class="capability-column reveal reveal-delay-${(index % 3) + 1}">
          <h3>${group.title}</h3>
          <ul>${group.items.map((item) => `<li>${item}</li>`).join("")}</ul>
        </article>`
        )
        .join("")}
    </div>
  </section>`;

const renderJourney = (site) => `
  <section id="journey" class="journey-section">
    <div class="journey-shell">
      <div class="section-head reveal">
        <p class="eyebrow">${site.journey.eyebrow}</p>
        <h2 class="section-title">${site.journey.title}</h2>
        <p class="section-copy">${site.journey.summary}</p>
      </div>
      <div class="journey-scoreboard reveal reveal-delay-1">
        <div class="score-panel from">
          <span>${site.journey.fromLabel}</span>
          <strong>2.73</strong>
        </div>
        <div class="score-arrow" aria-hidden="true">→</div>
        <div class="score-panel to">
          <span>${site.journey.toLabel}</span>
          <strong>4.0</strong>
        </div>
      </div>
      <p class="journey-bridge reveal reveal-delay-2">${site.journey.bridge}</p>
      <div class="journey-grid">
        ${site.journey.milestones
          .map(
            (item, index) => `
          <article class="journey-step reveal reveal-delay-${(index % 3) + 1}">
            <p class="journey-label">${item.label}</p>
            <h3>${item.title}</h3>
            <p>${item.text}</p>
          </article>`
          )
          .join("")}
      </div>
      <a class="cta-secondary journey-action reveal reveal-delay-3" href="${site.journey.action.href}">${site.journey.action.label}</a>
    </div>
  </section>`;

const renderEducation = (site) => `
  <section id="education" class="education-section">
    <div class="section-head reveal">
      <p class="eyebrow">${site.education.eyebrow}</p>
      <h2 class="section-title">${site.education.title}</h2>
      ${site.education.body ? `<p class="section-copy">${site.education.body}</p>` : ""}
    </div>
    <div class="education-grid">
      ${site.education.items
        .map(
          (item, index) => `
        <a class="education-card reveal reveal-delay-${(index % 3) + 1}" href="${item.href}" target="_blank" rel="noreferrer">
          <div class="education-media">
            <img src="${item.image}" alt="${item.imageAlt}" />
          </div>
          <div class="education-copy">
            <p class="education-label">${item.label}</p>
            <h3>${item.degree}</h3>
            <p>${item.school}</p>
            <p>${item.period}</p>
            <strong>${item.detail}</strong>
          </div>
        </a>`
        )
        .join("")}
    </div>
  </section>`;

const renderContact = (site) => `
  <section id="contact" class="contact-section">
    <div class="contact-card reveal">
      <p class="eyebrow">${site.contact.eyebrow}</p>
      <h2 class="section-title">${site.contact.title}</h2>
      <p class="section-copy">${site.contact.body}</p>
      <div class="email-shell">
        <span class="email-address">${site.contact.email}</span>
        <button type="button" class="copy-button" data-copy-email>${site.contact.copyLabel}</button>
      </div>
      <p class="copy-status" aria-live="polite">${site.contact.copySuccess}</p>
      <div class="contact-links contact-socials">${renderSocialLinks(site.contact.actions)}</div>
    </div>
  </section>`;

const renderFooter = (site, year) => `
  <footer class="site-footer">
    <p>${site.footer}</p>
    <small>&copy; ${year} ${site.hero.name}</small>
  </footer>`;

const renderNewPortfolioNotice = (site) => {
  const notice = site.newPortfolioNotice;
  if (!notice) return "";

  const external = /^https?:/i.test(notice.href);
  const target = external ? ' target="_blank" rel="noreferrer"' : "";

  return `<div class="new-portfolio-layer" hidden>
    <div class="modal-backdrop" data-close-new-portfolio></div>
    <section class="new-portfolio-card" role="dialog" aria-modal="true" aria-labelledby="new-portfolio-title" aria-describedby="new-portfolio-copy">
      <button class="modal-close new-portfolio-close" type="button" data-close-new-portfolio aria-label="${site.ui.close}">&times;</button>
      <p class="eyebrow">${notice.eyebrow}</p>
      <h2 id="new-portfolio-title" class="new-portfolio-title">${notice.title}</h2>
      <p id="new-portfolio-copy" class="new-portfolio-copy">${notice.body}</p>
      <div class="new-portfolio-actions">
        <a class="cta-primary" href="${notice.href}"${target} data-autofocus>${notice.linkLabel}</a>
        <button class="cta-secondary" type="button" data-close-new-portfolio>${notice.dismissLabel}</button>
      </div>
    </section>
  </div>`;
};

const renderPage = (site, shared) => {
  const payload = safeJson({ site, shared });

  return `<!DOCTYPE html>
<html lang="${site.languageCode}" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${site.title}</title>
  <meta name="description" content="${site.description}" />
  <script>
    (function () {
      try {
        var storedTheme = window.localStorage.getItem("portfolio-theme");
        if (storedTheme === "light" || storedTheme === "dark") {
          document.documentElement.setAttribute("data-theme", storedTheme);
        }
      } catch (error) {
        console.warn("Theme preload skipped.", error);
      }
    })();
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
  <link rel="alternate" hreflang="en" href="./index.html" />
  <link rel="alternate" hreflang="ko" href="./index_kr.html" />
  <link rel="alternate" hreflang="x-default" href="./index.html" />
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>
  ${renderNav(site, shared)}
  <main>
    ${renderHero(site, shared)}
    ${renderAbout(site)}
    ${renderPhilosophy(site)}
    ${renderExperience(site)}
    ${renderWork(site)}
    ${renderCapabilities(site)}
    ${renderEducation(site)}
    ${renderJourney(site)}
    ${renderContact(site)}
  </main>
  ${renderFooter(site, shared.year)}
  ${renderNewPortfolioNotice(site)}
  <div class="modal-layer" hidden>
    <div class="modal-backdrop" data-close-modal></div>
    <section class="project-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" type="button" data-close-modal aria-label="${site.ui.close}">&times;</button>
      <div class="modal-scroll">
        <div class="modal-content"></div>
      </div>
    </section>
  </div>
  <div class="lightbox-layer" hidden>
    <div class="modal-backdrop" data-close-lightbox></div>
    <section class="lightbox" role="dialog" aria-modal="true" aria-label="${site.ui.viewScreenshots}">
      <button class="modal-close" type="button" data-close-lightbox aria-label="${site.ui.close}">&times;</button>
      <button class="lightbox-nav prev" type="button" data-lightbox-step="-1" aria-label="${site.ui.previousImage}">&#8249;</button>
      <figure>
        <img src="" alt="${site.ui.screenshot}" />
        <figcaption></figcaption>
      </figure>
      <button class="lightbox-nav next" type="button" data-lightbox-step="1" aria-label="${site.ui.nextImage}">&#8250;</button>
    </section>
  </div>
  <script>window.__PORTFOLIO__ = ${payload};</script>
  <script defer src="./app.js"></script>
</body>
</html>`;
};

ensureDir(out("scripts"));

for (const locale of Object.values(portfolioSite.locales)) {
  const html = renderPage(locale, {
    year: portfolioSite.year,
    logos: portfolioSite.logos,
    heroMedia: portfolioSite.heroMedia,
    linkedinHref: portfolioSite.linkedinHref,
    githubHref: portfolioSite.githubHref,
    resumeHref: portfolioSite.resumeHref,
  });

  writeFileSync(out(locale.pagePath), html, "utf8");
}
