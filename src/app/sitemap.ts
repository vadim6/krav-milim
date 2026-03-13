import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://krav-milim.com", changeFrequency: "daily", priority: 1 },
    { url: "https://krav-milim.com/game", changeFrequency: "daily", priority: 0.9 },
    { url: "https://krav-milim.com/leaderboard", changeFrequency: "daily", priority: 0.7 },
  ]
}
