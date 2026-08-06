import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://callguard-pro.vercel.app", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://callguard-pro.vercel.app/bulk", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://callguard-pro.vercel.app/developer", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://callguard-pro.vercel.app/privacy", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: "https://callguard-pro.vercel.app/terms", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
