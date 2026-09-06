import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/streams/new"],
        // Individual stream pages and wallet-scoped dashboards are dynamic,
        // per-user views rather than content worth indexing individually.
        disallow: ["/streams/", "/sending", "/receiving"],
      },
    ],
  };
}
