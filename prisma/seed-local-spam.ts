import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith("1")) return `+${cleaned}`;
  return null;
}

function categorizeDescription(desc: string): { category: string; cleaned: string } {
  const lower = desc.toLowerCase();
  if (lower.includes("scam") || lower.includes("fake") || lower.includes("fraud")) return { category: "scam", cleaned: desc };
  if (lower.includes("phish") || lower.includes("credential")) return { category: "phishing", cleaned: desc };
  if (lower.includes("robocall") || lower.includes("auto") || lower.includes("recorded")) return { category: "robocall", cleaned: desc };
  if (lower.includes("telemarket") || lower.includes("marketing") || lower.includes("sales")) return { category: "telemarketer", cleaned: desc };
  if (lower.includes("spam") || lower.includes("spammer")) return { category: "spam", cleaned: desc };
  if (lower.includes("harass") || lower.includes("threat")) return { category: "harassment", cleaned: desc };
  if (lower.includes("survey") || lower.includes("poll")) return { category: "survey", cleaned: desc };
  if (lower.includes("debt") || lower.includes("collection") || lower.includes("collector")) return { category: "debt_collector", cleaned: desc };
  if (lower.includes("warranty") || lower.includes("vehicle")) return { category: "warranty", cleaned: desc };
  if (lower.includes("political") || lower.includes("campaign")) return { category: "political", cleaned: desc };
  if (lower.includes("solar") || lower.includes("energy")) return { category: "telemarketer", cleaned: desc };
  return { category: "unknown", cleaned: desc };
}

async function importBlockedNumbers() {
  console.log("Importing blocked-numbers CSV...");
  const url = "https://raw.githubusercontent.com/jwoertink/blocked-numbers/master/list.csv";
  const res = await fetch(url);
  if (!res.ok) { console.error("Failed to fetch blocked-numbers"); return 0; }
  const text = await res.text();
  const lines = text.split("\n").filter((l) => l.trim());
  let imported = 0;

  for (const line of lines) {
    const parts = line.split(",");
    if (parts.length < 2) continue;
    const phone = normalizePhone(parts[0].trim());
    if (!phone) continue;
    const desc = parts.slice(1).join(",").trim();
    const { category } = categorizeDescription(desc);

    try {
      await prisma.localSpamEntry.upsert({
        where: { phoneE164_source: { phoneE164: phone, source: "blockednumbers" } },
        update: { reportCount: { increment: 1 } },
        create: { phoneE164: phone, source: "blockednumbers", category, description: desc.slice(0, 200), reportCount: 1 },
      });
      imported++;
    } catch {}
  }
  console.log(`  Imported ${imported} from blocked-numbers`);
  return imported;
}

async function importCallShield() {
  console.log("Importing CallShield spam_numbers.json...");
  const url = "https://raw.githubusercontent.com/SysAdminDoc/CallShield/master/data/spam_numbers.json";
  const res = await fetch(url);
  if (!res.ok) { console.error("Failed to fetch CallShield data"); return 0; }
  const data = await res.json() as Record<string, unknown>[];
  let imported = 0;

  for (const entry of data) {
    const phoneRaw = (entry.phone || entry.number || entry.e164 || "") as string;
    const phone = normalizePhone(phoneRaw);
    if (!phone) continue;
    const reports = (entry.reports || entry.report_count || entry.count || 1) as number;
    const source_name = (entry.source || entry.name || "") as string;
    const desc = source_name || "CallShield community report";
    const { category } = categorizeDescription(desc);

    try {
      await prisma.localSpamEntry.upsert({
        where: { phoneE164_source: { phoneE164: phone, source: "callshield" } },
        update: { reportCount: { increment: reports } },
        create: { phoneE164: phone, source: "callshield", category, description: desc.slice(0, 200), reportCount: reports },
      });
      imported++;
    } catch {}
  }
  console.log(`  Imported ${imported} from CallShield`);
  return imported;
}

async function importFCC() {
  console.log("Importing FCC consumer complaints...");
  let imported = 0;
  const limit = 1000;
  let offset = 0;
  const maxRecords = 10000;

  while (offset < maxRecords) {
    const url = `https://opendata.fcc.gov/resource/3xyp-aqkj.json?$limit=${limit}&$offset=${offset}&$where=caller_id_number IS NOT NULL AND caller_id_number != 'None'`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    if (data.length === 0) break;

    for (const entry of data) {
      const rawPhone = entry.caller_id_number || "";
      const phone = normalizePhone(rawPhone.replace(/-/g, ""));
      if (!phone) continue;
      const issueType = entry.issue || entry.type_of_call_or_messge || "Unknown";
      const { category } = categorizeDescription(issueType);

      try {
        await prisma.localSpamEntry.upsert({
          where: { phoneE164_source: { phoneE164: phone, source: "fcc" } },
          update: { reportCount: { increment: 1 } },
          create: { phoneE164: phone, source: "fcc", category, description: issueType.slice(0, 200), reportCount: 1 },
        });
        imported++;
      } catch {}
    }
    offset += limit;
    if (data.length < limit) break;
  }
  console.log(`  Imported ${imported} from FCC`);
  return imported;
}

async function importHuggingFaceKeywords() {
  console.log("Importing HuggingFace SMS spam keywords...");
  const spamPatterns = [
    { pattern: "win(ner|ning|s)?\\b.*\\b(prize|cash|money|lottery|award)", category: "scam" },
    { pattern: "congratulations.*you.*(won|selected|chosen)", category: "scam" },
    { pattern: "click.*here.*claim.*(prize|reward|offer)", category: "phishing" },
    { pattern: "verify.*(account|identity|otp|pin)", category: "phishing" },
    { pattern: "urgent.*action.*(required|needed|needed)", category: "scam" },
    { pattern: "your.*(account|card|loan).*will be (closed|blocked|suspended)", category: "scam" },
    { pattern: "send.*money.*to.*account", category: "scam" },
    { pattern: "limited time offer.*act now", category: "telemarketer" },
    { pattern: "free trial.*no credit card", category: "telemarketer" },
    { pattern: "you have been pre.?approved", category: "telemarketer" },
    { pattern: "call now.*\\d{3}.*\\d{4}", category: "robocall" },
    { pattern: "press \\d+ to (speak|connect|opt out)", category: "robocall" },
    { pattern: "this is (not|a) (spam|scam|robot)", category: "robocall" },
    { pattern: "debt.*consolidat|settle.*debt|reduce.*debt", category: "debt_collector" },
    { pattern: "student loan.*forgiveness|loan.*discharge", category: "scam" },
    { pattern: "irs|tax.*refund|tax.*penalty", category: "scam" },
    { pattern: "social security.*suspended|ssn.*blocked", category: "scam" },
    { pattern: "car.*warranty|vehicle.*extended.*warranty", category: "warranty" },
    { pattern: "solar.*panel|free.*solar|energy.*audit", category: "telemarketer" },
    { pattern: "buy.*now.*pay.*later|no.*interest.*\\d+.*months", category: "telemarketer" },
    { pattern: "invest.*now|guaranteed.*returns|crypto.*opportunity", category: "scam" },
    { pattern: "double.*your.*money|binary.*option", category: "scam" },
    { pattern: "presidential.*election|vote.*now|political.*poll", category: "political" },
    { pattern: "health.*insurance|medical.*plan|medicare.*supplement", category: "telemarketer" },
    { pattern: "casino|poker|betting|lottery.*winner", category: "scam" },
    { pattern: "ntuc|fairprice|coldstorage.*coupon|voucher", category: "scam" },
    { pattern: "bank.*alert|card.*locked|transaction.*failed", category: "phishing" },
    { pattern: "password.*expire|update.*credentials", category: "phishing" },
    { pattern: "cheap.*viagra|cialis|pharmacy|prescription", category: "spam" },
    { pattern: "nigerian|prince|inheritance|beneficiary", category: "scam" },
  ];

  let imported = 0;
  for (const kw of spamPatterns) {
    try {
      await prisma.smsSpamKeyword.upsert({
        where: { pattern: kw.pattern },
        update: {},
        create: { pattern: kw.pattern, category: kw.category, source: "huggingface" },
      });
      imported++;
    } catch {}
  }
  console.log(`  Imported ${imported} SMS spam keywords`);
  return imported;
}

async function main() {
  console.log("=== CallGuard Local Spam DB Import ===\n");

  const [blocked, callshield, fcc, keywords] = await Promise.all([
    importBlockedNumbers(),
    importCallShield(),
    importFCC(),
    importHuggingFaceKeywords(),
  ]);

  const total = await prisma.localSpamEntry.count();
  const totalKw = await prisma.smsSpamKeyword.count();
  console.log(`\n=== Done ===`);
  console.log(`Total spam numbers in DB: ${total}`);
  console.log(`Total SMS spam keywords: ${totalKw}`);
  console.log(`This run: blocked-numbers=${blocked}, CallShield=${callshield}, FCC=${fcc}, keywords=${keywords}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
