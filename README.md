<div align="center">

# CallGuard — Community Caller ID & Spam Shield

**Open-source caller ID and spam detection platform. Know who's calling before you pick up.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-callguard--pro.vercel.app-22c55e?style=for-the-badge&logo=vercel)](https://callguard-pro.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Code of Conduct](https://img.shields.io/badge/Code%20of-Conduct-blueviolet?style=for-the-badge)](CODE_OF_CONDUCT.md)

</div>

---

## What is CallGuard?

CallGuard is a community-powered caller identification and spam reporting platform. Look up any phone number to get real-time carrier info, fraud scores, and caller identity — powered by three independent threat intelligence engines and crowd-sourced reports from users worldwide.

Every report, vote, and tag makes the network smarter. When someone marks a number as "Scam" or "Telemarketer", that intel is available to everyone.

## Live Demo

**Try it now — no signup required:**

**[https://callguard-pro.vercel.app](https://callguard-pro.vercel.app)**

## Features

| Feature | Description |
| --- | --- |
| **Triple-Engine Lookups** | NumLookupAPI, Numverify, and IPQualityScore run in parallel for carrier, line type, fraud score, and identity data |
| **Community Reports** | Tag any number as Scam, Telemarketer, Delivery, Safe, and more |
| **Crowd Voting** | Upvote/downvote caller names to verify accuracy |
| **Bulk Scanning** | Scan up to 10 numbers at once |
| **Search History** | Automatic tracking of your recent lookups |
| **Contacts & Blocklist** | Save contacts and block unwanted numbers |
| **Public Directory** | Browse a filterable grid of reported numbers with spam scores |
| **Developer API** | JSON API for programmatic lookups |
| **Admin Dashboard** | Moderate community reports |
| **Light & Dark Mode** | Custom theme switcher |

## How It Works

```
User enters phone number
        │
        ▼
┌─────────────────────────────────┐
│   Triple-Engine Parallel Scan   │
│  NumLookup + Numverify + IPQS   │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│      Community Reports &        │
│      Crowd Verification         │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   Combined Threat Intelligence  │
│   Score + Caller Identity       │
└─────────────────────────────────┘
```

1. **Normalize** — Any phone format is parsed into E.164 standard
2. **Scan** — Three APIs run in parallel for carrier, fraud, and identity data
3. **Enrich** — Community reports and votes add crowd-sourced intelligence
4. **Report** — Combined threat score, likely name, and full breakdown delivered

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Auth | NextAuth.js |
| Deployment | Vercel |

## API Reference

### Lookup a Number

```
GET /api/developer/lookup?phone=+919876543210&api_key=YOUR_KEY
```

**Response:**

```json
{
  "status": 200,
  "data": {
    "e164": "+919876543210",
    "valid": true,
    "carrier": "Jio",
    "location": "Mumbai, Maharashtra",
    "lineType": "mobile",
    "fraudScore": 0,
    "isVoip": false,
    "callerName": null
  }
}
```

### Submit a Report

```
POST /api/numbers/{phone}
Content-Type: application/json

{
  "displayName": "Scam Caller",
  "category": "SCAM",
  "note": "Asked for OTP"
}
```

**Categories:** `SCAM`, `TELEMARKETER`, `FRAUD`, `DELIVERY`, `BANK_FINANCE`, `SURVEY`, `ROBOCALL`, `HARASSMENT`, `SAFE`, `OTHER`

## Environment Variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth session secret |
| `NEXTAUTH_URL` | Your deployed URL |
| `NUMVERIFY_API_KEY` | Numverify API key |
| `IPQS_API_KEY` | IPQualityScore API key |
| `NUMLOOKUP_API_KEY` | NumLookupAPI key |
| `ADMIN_SECRET` | Admin dashboard secret |
| `DEVELOPER_API_KEYS` | Comma-separated API keys for developer endpoint |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)

## Developed By

**Jojin John**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/jojin-john/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/jojin1709)
