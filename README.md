<div align="center">

# CallGuard — Multi-Engine Intelligence Platform

**Free, open-source phone, email, IP, domain, and SMS spam detection.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-callguard--pro.vercel.app-22c55e?style=for-the-badge&logo=vercel)](https://callguard-pro.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Security](https://img.shields.io/badge/Security-Hardened-red?style=for-the-badge)](#security)

</div>

---

## What is CallGuard?

CallGuard is a free, community-powered multi-engine intelligence platform. Look up any phone number, email address, IP address, or domain to get real-time carrier info, fraud scores, caller identity, spam database checks, and disposable email detection — powered by **7 independent intelligence engines**, a **51,000+ number local spam database**, and crowd-sourced reports from users worldwide.

**No signup required. No paywalls. Just search and go.**

## Live Demo

**[https://callguard-pro.vercel.app](https://callguard-pro.vercel.app)**

## Features

| Feature | Description |
| --- | --- |
| **Phone Lookup (7 engines)** | NumLookup, Numverify, IPQS, FreeCNAM, Neutrino Validate, Neutrino HLR, Local Spam DB |
| **Email Verification** | Neutrino email-verify — disposable, freemail, catch-all, SMTP status, domain health |
| **IP Geolocation** | Neutrino IP info — hostname, country, region, city, timezone, coordinates |
| **Domain Reputation** | Neutrino domain-lookup — malicious flag, rank, age, registrar, DNS/mail/website status |
| **SMS Spam Checker** | 30+ regex patterns for phishing, scam, robocall, and spam detection |
| **Local Spam Database** | 51K+ numbers from blocked-numbers, CallShield, FCC complaints, and SMS keywords |
| **Caller Name (CNAM)** | FreeCNAM integration provides real caller names for US numbers |
| **Carrier-Level Detection** | Neutrino HLR detects roaming, porting, and real-time carrier info |
| **Community Reports** | Tag any number as Scam, Telemarketer, Delivery, Safe, and more |
| **Crowd Voting** | Upvote/downvote caller names to verify accuracy |
| **Bulk Scanning** | Scan up to 10 numbers at once |
| **Search History** | Automatic tracking of your recent lookups |
| **Contacts & Blocklist** | Save contacts and block unwanted numbers |
| **Public Directory** | Browse a filterable grid of reported numbers with spam scores |
| **Developer API** | JSON API for phone, email, IP, domain, and SMS lookups |
| **Admin Dashboard** | Moderate reports, manage local spam DB, import/clear data sources |
| **Light & Dark Mode** | Custom theme switcher |
| **No Login Required** | Everything works without creating an account |

## How It Works

```
User enters phone number
        │
        ▼
┌─────────────────────────────────────────┐
│    7-Engine Parallel Intelligence Scan  │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │ Numverify│  │Numlookup │  │ IPQS  │ │
│  └──────────┘  └──────────┘  └───────┘ │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │FreeCNAM  │  │ Neutrino │  │ Local │ │
│  │(caller)  │  │(validate │  │ Spam  │ │
│  │          │  │ + HLR)   │  │  DB   │ │
│  └──────────┘  └──────────┘  └───────┘ │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│      Community Reports & Crowd          │
│      Verification + SMS Keywords        │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│   Combined Threat Intelligence Score    │
│   + Carrier + Roaming + Ported Status   │
│   + Caller Identity + Line Type         │
└─────────────────────────────────────────┘
```

1. **Normalize** — Any phone format is parsed into E.164 standard
2. **Scan** — 7 APIs run in parallel for carrier, fraud, identity, and local DB data
3. **Enrich** — Community reports, crowd votes, and SMS keyword matching add intelligence
4. **Report** — Combined threat score, carrier info, roaming/porting status, and caller name delivered

## Intelligence Sources

| # | Source | Type | Data Provided |
|---| --- | --- | --- |
| 1 | **Numverify** | API (100/mo free) | Carrier, line type, location |
| 2 | **NumLookupAPI** | API (100/mo free) | Carrier, line type, location |
| 3 | **IPQualityScore** | API (~1K/mo free) | Fraud score, spammer flag, VOIP, risky |
| 4 | **FreeCNAM** | API (unlimited) | Caller name (CNAM) |
| 5 | **Neutrino Phone Validate** | API (10K/day free) | Number type, location, carrier prefix |
| 6 | **Neutrino HLR Lookup** | API (paid) | Real carrier, roaming, ported status |
| 7 | **Local Spam DB** | Self-hosted | 51K+ spam numbers + 30 SMS keyword patterns |

### Local Spam Database Sources

| Source | Records | Description |
| --- | --- | --- |
| blocked-numbers (GitHub) | 900+ | Community-curated robocall/spam list |
| CallShield | 51,000+ | Open-source Android spam DB (FCC, FTC, community) |
| FCC Consumer Complaints | 10,000+ | Government unwanted-call complaint data |
| SMS Spam Keywords | 30 patterns | Regex patterns from HuggingFace SMS Spam dataset |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Deployment | Vercel |

## API Reference

### Phone Lookup (requires API key)
```
GET /api/developer/lookup?phone=+919876543210&api_key=YOUR_KEY
```

### Email Verification
```
GET /api/developer/email?email=user@example.com
```

### IP Geolocation
```
GET /api/developer/ip?ip=8.8.8.8
```

### Domain Reputation
```
GET /api/developer/domain?domain=example.com
```

### SMS Spam Check
```
POST /api/developer/sms
Content-Type: application/json

{ "text": "Congratulations! You won a free iPhone." }
```

## Security

CallGuard is hardened against common web attacks:

| Protection | Implementation |
| --- | --- |
| **XSS Prevention** | All user inputs sanitized — HTML tags and scripts stripped |
| **SQL Injection** | Prisma ORM uses parameterized queries |
| **CSRF Protection** | SameSite cookies, token validation ready |
| **Content Security Policy** | Strict CSP headers restrict script and resource sources |
| **HSTS** | Forces HTTPS for 1 year with preload |
| **Rate Limiting** | Per-IP rate limits on all API endpoints |
| **Input Validation** | Zod schemas with length limits on all endpoints |
| **Clickjacking** | X-Frame-Options: DENY |
| **Admin Auth** | Secret key + 3-attempt lockout with 24hr cooldown |

## Environment Variables

| Variable | Description | Required |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth session secret | Yes |
| `NEXTAUTH_URL` | Your deployed URL | Yes |
| `ADMIN_SECRET` | Admin dashboard secret key | Yes |
| `DEVELOPER_API_KEYS` | Comma-separated API keys for developer endpoint | Yes |
| `NUMVERIFY_API_KEY` | Numverify API key | Optional |
| `IPQS_API_KEY` | IPQualityScore API key | Optional |
| `NUMLOOKUP_API_KEY` | NumLookupAPI key | Optional |
| `NEUTRINO_API_USER_ID` | Neutrino API user ID | Optional |
| `NEUTRINO_API_KEY` | Neutrino API key | Optional |

> **Note:** All API keys are optional. The app works without any API keys using the local spam database and FreeCNAM (no key needed). Adding more keys improves lookup coverage.

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
