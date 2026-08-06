import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CallGuard database...");

  const guestUser = await prisma.user.upsert({
    where: { email: "guest@callguard.local" },
    update: {},
    create: {
      id: "guest-user-default",
      name: "Community Member",
      email: "guest@callguard.local",
      passwordHash: "guest-no-password",
    },
  });

  const sampleData = [
    {
      e164: "+919876543210",
      countryCode: "IN",
      reports: [
        { displayName: "Fake SBI Executive", category: "SCAM", note: "Claimed my credit card was blocked and demanded OTP. Total scam!" },
        { displayName: "SBI Card Fraud", category: "SCAM", note: "Posing as bank manager asking for CVV and expiry date." },
        { displayName: "SBI Scam Call", category: "SCAM", note: "Rude scammer asking for netbanking credentials." },
      ],
      blockReason: "Bank OTP phishing scam",
      contactName: "SBI Card Scam (Do Not Answer)",
    },
    {
      e164: "+919988776655",
      countryCode: "IN",
      reports: [
        { displayName: "Power Bill Scam", category: "FRAUD", note: "SMS sent saying power will be cut tonight at 9:30 PM unless I pay via APK link." },
        { displayName: "Electricity Dept Fraud", category: "FRAUD", note: "Threatening disconnect scam." },
      ],
      blockReason: "Electricity bill fake urgency scam",
    },
    {
      e164: "+18005550199",
      countryCode: "US",
      reports: [
        { displayName: "IRS Impersonator", category: "SCAM", note: "Automated robocall demanding immediate wire transfer for back taxes or arrest warrant." },
        { displayName: "IRS Scam", category: "ROBOCALL", note: "Recorded voice threatening legal action." },
      ],
      blockReason: "IRS impostor robocall",
    },
    {
      e164: "+919123456789",
      countryCode: "IN",
      reports: [
        { displayName: "Fake Customs Officer", category: "SCAM", note: "Posing as Mumbai Police/Customs claiming a package containing illegal items was seized." },
        { displayName: "FedEx Package Fraud", category: "SCAM", note: "Demanded money on Skype to clear charges." },
      ],
      blockReason: "Digital arrest / Police impersonation fraud",
    },
    {
      e164: "+919811122334",
      countryCode: "IN",
      reports: [
        { displayName: "Crypto Profits Scam", category: "FRAUD", note: "Promising 10x returns on WhatsApp crypto group." },
        { displayName: "Telegram Investment Scam", category: "FRAUD", note: "Fake trading portal, wouldn't allow withdrawal." },
      ],
    },
    {
      e164: "+919876012345",
      countryCode: "IN",
      reports: [
        { displayName: "Part Time Job Scam", category: "SCAM", note: "Pays ₹50 per YouTube like then tricks you into ₹50,000 prepaid crypto tasks." },
        { displayName: "Telegram Job Fraud", category: "SCAM", note: "Prepaid task investment scam." },
      ],
    },
    {
      e164: "+919822012345",
      countryCode: "IN",
      reports: [
        { displayName: "Pre-approved Loan", category: "TELEMARKETER", note: "Calls 5 times a day offering instant loan at high interest rate." },
        { displayName: "Personal Loan Sales", category: "TELEMARKETER", note: "Unsolicited spam caller." },
      ],
    },
    {
      e164: "+919833054321",
      countryCode: "IN",
      reports: [
        { displayName: "Property Broker Spam", category: "TELEMARKETER", note: "Promotional calls for new residential projects." },
      ],
    },
    {
      e164: "+18005550123",
      countryCode: "US",
      reports: [
        { displayName: "Car Extended Warranty", category: "ROBOCALL", note: "Calling about vehicle warranty expiration." },
        { displayName: "Warranty Spam", category: "TELEMARKETER", note: "Spam telemarketing." },
      ],
    },
    {
      e164: "+919711002233",
      countryCode: "IN",
      reports: [
        { displayName: "Lifetime Free Card Offer", category: "TELEMARKETER", note: "Persistent sales caller." },
      ],
    },
    {
      e164: "+919844112233",
      countryCode: "IN",
      reports: [
        { displayName: "Share Market Tips", category: "TELEMARKETER", note: "Unsolicited calls promising 99% accuracy in stock tips." },
      ],
    },
    {
      e164: "+18005550144",
      countryCode: "US",
      reports: [
        { displayName: "Election Survey IVR", category: "ROBOCALL", note: "Automated political polling message." },
      ],
    },
    {
      e164: "+919711223344",
      countryCode: "IN",
      reports: [
        { displayName: "Policy Bazaar Impersonator", category: "ROBOCALL", note: "Pre-recorded insurance policy advertisement." },
      ],
    },
    {
      e164: "+919899887766",
      countryCode: "IN",
      reports: [
        { displayName: "Loan App Recovery Agent", category: "HARASSMENT", note: "Abusive language and calling contacts list." },
      ],
    },
    {
      e164: "+919877665544",
      countryCode: "IN",
      reports: [
        { displayName: "Wangiri Missed Call", category: "HARASSMENT", note: "Rings once so you call back to a premium rate charged number." },
      ],
    },
    {
      e164: "+919800011122",
      countryCode: "IN",
      reports: [
        { displayName: "Amazon Courier Driver", category: "DELIVERY", note: "Verified delivery driver for package handoff." },
      ],
      contactName: "Amazon Delivery Driver",
    },
    {
      e164: "+919800033344",
      countryCode: "IN",
      reports: [
        { displayName: "BlueDart Delivery Staff", category: "DELIVERY", note: "Official delivery guy calling before arrival." },
      ],
      contactName: "BlueDart Executive",
    },
    {
      e164: "+919800055566",
      countryCode: "IN",
      reports: [
        { displayName: "Swiggy Rider", category: "DELIVERY", note: "Calling to confirm delivery location." },
      ],
    },
    {
      e164: "+911800112211",
      countryCode: "IN",
      reports: [
        { displayName: "SBI Customer Care", category: "SAFE", note: "Official bank customer support helpline." },
      ],
      contactName: "SBI Helpline",
    },
    {
      e164: "+911800226022",
      countryCode: "IN",
      reports: [
        { displayName: "HDFC Official Care", category: "SAFE", note: "Official toll-free line to block stolen cards." },
      ],
      contactName: "HDFC Card Support",
    },
    {
      e164: "+442079460912",
      countryCode: "GB",
      reports: [
        { displayName: "National Rail Line", category: "SAFE", note: "Train schedules and support line." },
      ],
    },
  ];

  for (const item of sampleData) {
    const phone = await prisma.phoneNumber.upsert({
      where: { e164: item.e164 },
      update: {},
      create: { e164: item.e164, countryCode: item.countryCode },
    });

    // Create reports (skip if already exists)
    for (const r of item.reports) {
      const existing = await prisma.report.findFirst({
        where: { phoneNumberId: phone.id, displayName: r.displayName, category: r.category },
      });
      if (!existing) {
        await prisma.report.create({
          data: {
            phoneNumberId: phone.id,
            userId: guestUser.id,
            displayName: r.displayName,
            category: r.category,
            note: r.note,
          },
        });
      }
    }

    if (item.blockReason) {
      await prisma.blocklistEntry.upsert({
        where: { userId_phoneNumberId: { userId: guestUser.id, phoneNumberId: phone.id } },
        update: { reason: item.blockReason },
        create: { userId: guestUser.id, phoneNumberId: phone.id, reason: item.blockReason },
      });
    }

    if (item.contactName) {
      await prisma.contact.upsert({
        where: { userId_phoneNumberId: { userId: guestUser.id, phoneNumberId: phone.id } },
        update: { name: item.contactName },
        create: { userId: guestUser.id, phoneNumberId: phone.id, name: item.contactName },
      });
    }
  }

  console.log(`Successfully seeded ${sampleData.length} numbers with community reports!`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
