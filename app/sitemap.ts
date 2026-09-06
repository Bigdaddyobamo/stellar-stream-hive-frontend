import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://stellar-stream-hive.example";

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/streams/new`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
