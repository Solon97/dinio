module.exports = {
  siteUrl: process.env.SITE_URL || "https://dinio.com.br",
  generateRobotsTxt: true,
  exclude: ["/*"],
  additionalPaths: async (config) => {
    // Basic paths
    const paths = [
      await config.transform(config, "/"),
      await config.transform(config, "/diagnostico"),
      await config.transform(config, "/ferramentas"),
      await config.transform(config, "/tos"),
      await config.transform(config, "/privacy-policy"),
      await config.transform(config, "/cookies-policy"),
    ];

    // Seo tools dynamic slugs
    const { seoTools } = require("./libs/seoTools.ts");
    const seoToolsPaths = await Promise.all(
      seoTools.map((tool) => config.transform(config, `/ferramentas/${tool.slug}`))
    );

    return [...paths, ...seoToolsPaths];
  },
  transform: async (config, path) => {
    const highPriority = ["/", "/diagnostico", "/ferramentas"];
    const lowPriority = ["/tos", "/privacy-policy", "/cookies-policy"];

    if (highPriority.includes(path) || path.startsWith("/ferramentas/")) {
      return {
        loc: path,
        changefreq: "weekly",
        priority: path === "/" ? 1.0 : 0.8,
        lastmod: new Date().toISOString(),
      };
    }

    if (lowPriority.includes(path)) {
      return {
        loc: path,
        changefreq: "monthly",
        priority: 0.5,
        lastmod: new Date().toISOString(),
      };
    }

    return {
      loc: path,
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date().toISOString(),
    };
  },
};
