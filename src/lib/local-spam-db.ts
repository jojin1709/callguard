import { prisma } from "./prisma";

export type LocalSpamResult = {
  isSpam: boolean;
  spamScore: number; // 0-100
  sources: string[];
  categories: string[];
  descriptions: string[];
  reportCount: number;
  matchedKeywords: string[];
};

const SPAM_CATEGORY_WEIGHTS: Record<string, number> = {
  scam: 90,
  phishing: 95,
  fraud: 85,
  robocall: 70,
  telemarketer: 50,
  spam: 60,
  harassment: 80,
  survey: 40,
  debt_collector: 45,
  warranty: 55,
  political: 30,
  unknown: 20,
};

let cachedResult = new Map<string, LocalSpamResult>();

export async function lookupLocalSpamDB(phoneE164: string): Promise<LocalSpamResult> {
  const cached = cachedResult.get(phoneE164);
  if (cached) return cached;

  const result: LocalSpamResult = {
    isSpam: false,
    spamScore: 0,
    sources: [],
    categories: [],
    descriptions: [],
    reportCount: 0,
    matchedKeywords: [],
  };

  try {
    const entries = await prisma.localSpamEntry.findMany({
      where: { phoneE164 },
      orderBy: { reportCount: "desc" },
    });

    if (entries.length === 0) {
      cachedResult.set(phoneE164, result);
      return result;
    }

    result.isSpam = true;
    result.sources = [...new Set(entries.map((e) => e.source))];
    result.categories = [...new Set(entries.map((e) => e.category))];
    result.descriptions = entries
      .filter((e) => e.description)
      .map((e) => e.description!)
      .slice(0, 5);
    result.reportCount = entries.reduce((sum, e) => sum + e.reportCount, 0);

    let maxScore = 0;
    for (const cat of result.categories) {
      const weight = SPAM_CATEGORY_WEIGHTS[cat] || 20;
      maxScore = Math.max(maxScore, weight);
    }

    const sourceBonus: Record<string, number> = {
      callshield: 15,
      blockednumbers: 10,
      fcc: 20,
      community: 5,
    };
    for (const src of result.sources) {
      maxScore += sourceBonus[src] || 0;
    }

    const reportBonus = Math.min(result.reportCount * 2, 20);
    maxScore += reportBonus;

    result.spamScore = Math.min(maxScore, 100);
  } catch (err) {
    console.error("Local spam DB lookup error:", err);
  }

  cachedResult.set(phoneE164, result);
  return result;
}

export async function checkSmsSpamKeywords(text: string): Promise<{ isSpam: boolean; matchedKeywords: string[]; category: string | null }> {
  const result = { isSpam: false, matchedKeywords: [] as string[], category: null as string | null };

  try {
    const keywords = await prisma.smsSpamKeyword.findMany();
    const lowerText = text.toLowerCase();

    for (const kw of keywords) {
      try {
        const regex = new RegExp(kw.pattern, "i");
        if (regex.test(lowerText)) {
          result.isSpam = true;
          result.matchedKeywords.push(kw.pattern);
          if (!result.category) result.category = kw.category;
        }
      } catch {
        if (lowerText.includes(kw.pattern.toLowerCase())) {
          result.isSpam = true;
          result.matchedKeywords.push(kw.pattern);
          if (!result.category) result.category = kw.category;
        }
      }
    }
  } catch (err) {
    console.error("SMS spam keyword check error:", err);
  }

  return result;
}

export async function getLocalSpamStats(): Promise<{
  totalNumbers: number;
  totalKeywords: number;
  bySource: { source: string; count: number }[];
  byCategory: { category: string; count: number }[];
}> {
  try {
    const [totalNumbers, totalKeywords, bySource, byCategory] = await Promise.all([
      prisma.localSpamEntry.count(),
      prisma.smsSpamKeyword.count(),
      prisma.localSpamEntry.groupBy({ by: ["source"], _count: true, orderBy: { _count: { source: "desc" } } }),
      prisma.localSpamEntry.groupBy({ by: ["category"], _count: true, orderBy: { _count: { category: "desc" } } }),
    ]);

    return {
      totalNumbers,
      totalKeywords,
      bySource: bySource.map((s) => ({ source: s.source, count: s._count })),
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count })),
    };
  } catch {
    return { totalNumbers: 0, totalKeywords: 0, bySource: [], byCategory: [] };
  }
}

export function clearLocalSpamCache(): void {
  cachedResult.clear();
}
