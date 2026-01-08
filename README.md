<p align="center">
  <img src="apps/web/public/images/zeitpal-logo.svg" alt="ZeitPal Logo" width="120" />
</p>

<h1 align="center">ZeitPal</h1>

<p align="center">
  <strong>Modern Leave Management for Teams</strong><br>
  GDPR-compliant absence management built for the modern workplace. Free for non-commercial use.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://github.com/cderinbogaz/zeitpal/stargazers">
    <img src="https://img.shields.io/github/stars/cderinbogaz/zeitpal?style=social" alt="GitHub Stars">
  </a>
  <a href="https://github.com/cderinbogaz/zeitpal/network/members">
    <img src="https://img.shields.io/github/forks/cderinbogaz/zeitpal?style=social" alt="GitHub Forks">
  </a>
  <a href="https://github.com/cderinbogaz/zeitpal/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-Non--Commercial-orange.svg" alt="License">
  </a>
  <a href="https://github.com/cderinbogaz/zeitpal/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/cderinbogaz/zeitpal/ci.yml?branch=main" alt="CI Status">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwindcss" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase" alt="Supabase">
</p>

---

## Why ZeitPal?

Managing employee leave shouldn't require expensive enterprise software or endless Excel spreadsheets. ZeitPal is a **free for non-commercial use** solution that makes leave management simple, transparent, and compliant with European data protection regulations.

**Free for teams up to 20 employees** — no credit card, no hidden fees.

### Key Benefits

- **Save 5+ hours per month** on administrative tasks
- **Setup in under 15 minutes** — no training required
- **100% GDPR compliant** — data hosted in the EU
- **German labor law support** — including state-specific holidays

---

## Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **Leave Requests** | Submit and approve leave requests with one click |
| **Team Calendar** | Visual overview of team availability and absences |
| **Sick Leave** | Digital sick leave reporting with certificate reminders |
| **Leave Balances** | Automatic calculation of remaining days, carryover, and pro-rata |
| **Approval Workflows** | Flexible approval chains for different absence types |
| **Notifications** | Email and Slack notifications for requests and approvals |

### For Growing Teams (21+ employees)

- Advanced reports and analytics
- Multiple team management
- Slack and Google Calendar integration
- Custom leave types
- Priority support

### For Enterprises (100+ employees)

- SSO/SAML authentication
- API access
- Dedicated account manager
- SLA guarantee
- On-premise deployment option

---

## Demo

🌐 **Live Demo:** [https://zeitpal.com](https://zeitpal.com)

### Screenshots

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="Dashboard" width="45%">
  <img src="docs/screenshots/calendar.png" alt="Team Calendar" width="45%">
</p>

<p align="center">
  <img src="docs/screenshots/leave-request.png" alt="Leave Request" width="45%">
  <img src="docs/screenshots/reports.png" alt="Reports" width="45%">
</p>

---

## Tech Stack

ZeitPal is built with modern, production-ready technologies:

| Technology | Purpose |
|------------|---------|
| [Next.js 15](https://nextjs.org/) | React framework with App Router |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS framework |
| [Supabase](https://supabase.com/) | PostgreSQL database & authentication |
| [Turborepo](https://turbo.build/) | Monorepo build system |
| [Shadcn UI](https://ui.shadcn.com/) | Accessible component library |
| [i18next](https://www.i18next.com/) | Internationalization (DE/EN) |
| [React Query](https://tanstack.com/query) | Data fetching and caching |
| [Zod](https://zod.dev/) | Schema validation |
| [Playwright](https://playwright.dev/) | End-to-end testing |

---

## Quick Start

### Prerequisites

- **Node.js** 18.x or later
- **Docker** (for local Supabase)
- **pnpm** (package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/cderinbogaz/zeitpal.git
cd zeitpal

# Install dependencies
pnpm install

# Start Supabase (requires Docker)
pnpm run supabase:web:start

# Start the development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see ZeitPal running.

### Supabase Dashboard

Access the local Supabase dashboard at [http://localhost:54323](http://localhost:54323) to manage your database.

---

## Project Structure

```
zeitpal/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/
│       │   ├── (marketing)/    # Public marketing pages
│       │   ├── auth/           # Authentication pages
│       │   └── home/           # Protected app pages
│       ├── supabase/           # Database & migrations
│       └── config/             # App configuration
│
├── packages/
│   ├── ui/                     # Shared UI components
│   └── features/               # Core feature packages
│       └── auth/               # Authentication logic
│
└── docs/                       # Documentation
```

---

## Configuration

### Environment Variables

Create a `.env.local` file in `apps/web/` with:

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_PRODUCT_NAME=ZeitPal

# Supabase (local defaults)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Theme
NEXT_PUBLIC_DEFAULT_THEME_MODE=light
NEXT_PUBLIC_THEME_COLOR=#7c3aed
```

See [Environment Variables](#environment-variables-reference) for the full list.

---

## Deployment

### Cloudflare Pages (Recommended)

```bash
# Build for production
pnpm run build

# Deploy to Cloudflare
npx wrangler pages deploy apps/web/.next
```

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cderinbogaz/zeitpal)

### Docker

```bash
docker build -t zeitpal .
docker run -p 3000:3000 zeitpal
```

### Production Supabase

1. Create a [Supabase project](https://supabase.com/)
2. Push migrations: `pnpm --filter web supabase db push`
3. Set callback URL: `<your-url>/auth/callback`
4. Update environment variables

---

## Development

### Available Scripts

```bash
# Development
pnpm run dev              # Start development server

# Code Quality
pnpm run lint             # Run ESLint
pnpm run format:fix       # Format code with Prettier
pnpm run typecheck        # TypeScript validation

# Database
pnpm run supabase:web:start   # Start local Supabase
pnpm run supabase:web:stop    # Stop local Supabase
pnpm run supabase:web:reset   # Reset database
pnpm run supabase:web:typegen # Generate TypeScript types

# Testing
pnpm run test             # Run tests
```

### Creating Database Migrations

```bash
pnpm --filter web supabase migration new --name <migration-name>
pnpm run supabase:web:reset
```

---

## Contributing

We love contributions! ZeitPal is a source-available project and we welcome developers of all skill levels.

### How to Contribute

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/cderinbogaz/zeitpal.git`
3. **Create** a branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes
5. **Test** your changes: `pnpm run lint && pnpm run typecheck`
6. **Commit**: `git commit -m 'Add amazing feature'`
7. **Push**: `git push origin feature/amazing-feature`
8. **Open** a Pull Request

### Good First Issues

Looking for a place to start? Check out issues labeled [`good first issue`](https://github.com/cderinbogaz/zeitpal/labels/good%20first%20issue).

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Keep PRs focused and small

---

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Calendar integrations (Outlook, Apple Calendar)
- [ ] HR system integrations (Personio, HRworks)
- [ ] AI-powered leave suggestions
- [ ] Multi-language support (FR, ES, IT)
- [ ] Advanced analytics dashboard

See the [open issues](https://github.com/cderinbogaz/zeitpal/issues) for a full list of proposed features.

---

## Community

- **Discussions:** [GitHub Discussions](https://github.com/cderinbogaz/zeitpal/discussions)
- **Issues:** [GitHub Issues](https://github.com/cderinbogaz/zeitpal/issues)

---

## Support

- **Documentation:** [docs.zeitpal.com](https://docs.zeitpal.com)
- **Email:** support@zeitpal.com
- **Enterprise:** enterprise@zeitpal.com

---

## Sponsors

ZeitPal is free for non-commercial use. If you find it useful, please consider sponsoring:

<a href="https://github.com/sponsors/cderinbogaz">
  <img src="https://img.shields.io/badge/Sponsor-❤️-pink?style=for-the-badge" alt="Sponsor">
</a>

---

## License

This project is licensed under a **Non-Commercial License** — free for personal and educational use. For commercial use, please contact enterprise@zeitpal.com. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Built with love using:

- [MakerKit](https://makerkit.dev) — SaaS starter template
- [Shadcn UI](https://ui.shadcn.com) — Component library
- [Supabase](https://supabase.com) — Backend infrastructure

---

<p align="center">
  <strong>⭐ Star this repo if you find ZeitPal useful!</strong>
</p>

<p align="center">
  Made with ❤️ in Germany
</p>
