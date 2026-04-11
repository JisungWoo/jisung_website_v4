import { enProjects } from "./en-projects.mjs";
import { enSite } from "./en-site.mjs";
import { koProjects } from "./ko-projects.mjs";
import { koSite } from "./ko-site.mjs";
import { siteScaffold } from "./shared.mjs";

export const portfolioSite = {
  ...siteScaffold,
  locales: {
    en: {
      ...enSite,
      modalProjects: enProjects,
    },
    ko: {
      ...koSite,
      modalProjects: koProjects,
    },
  },
};
