# RemitWise Intelligence Platform

A production-grade, cloud-native Global Payment Intelligence SaaS platform. RemitWise empowers banks, FinTechs, and payment gateways with advanced merchant verification, robust BIN lookup engines, and strict ISO-standard routing validations.

![RemitWise Brand](https://via.placeholder.com/1200x400/111827/FFFFFF?text=RemitWise+Intelligence+Platform)

## 🚀 Features

- **Merchant Intelligence Module**: Comprehensive tracking of merchants, aliases, branches, locations, enriched AI insights, and calculated risk profiles.
- **BIN Lookup Engine**: Decodes Bank Identification Numbers instantly to reveal Card Brands, Types, Levels, Issuers, and Geo-Origins.
- **Global Validation Tools**:
  - **US Routing Validations**: ABA Modulus 10 checksum validation.
  - **IBAN Validations**: ISO 13616 Modulus 97 international checks.
- **Enterprise UI**: A breathtaking dark-mode interface built on Next.js, Tailwind CSS, and Shadcn UI.
- **Lightning API**: Fully typed, high-performance REST APIs built with Python FastAPI and Pydantic.

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Shadcn UI, Lucide React
- **Backend Core**: Python 3.12, FastAPI, Pydantic
- **Database Layer**: PostgreSQL 15, SQLAlchemy ORM, Alembic Migrations
- **Orchestration**: Docker & Docker Compose

## 🛠️ Quick Start (Docker Orchestration)

The easiest way to spin up the entire RemitWise ecosystem is using Docker.

1. **Ensure Docker is running** on your local machine.
2. Clone the repository and navigate to the root directory.
3. Run the complete orchestration command:
   ```bash
   docker compose up -d
   ```

### What happens when you run `docker-compose up`?
* **Database**: Spins up a PostgreSQL 15 instance.
* **Backend**: Boots the FastAPI server (Port: `8000`), automatically running all Alembic SQL schemas and migrations.
* **Frontend**: Boots the Next.js standalone dashboard application (Port: `3000`).
* **Legacy System**: Keeps the original Node MVP active (Port: `5000`).

### Accessing the Platform
- **Enterprise Dashboard (Next.js)**: [http://localhost:3000](http://localhost:3000)
- **Enterprise API Docs (Swagger)**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **Legacy Node API**: [http://localhost:5000](http://localhost:5000)

## 📁 Repository Structure

```text
/
├── enterprise/
│   ├── backend/               # FastAPI Application & SQLAlchemy Models
│   │   ├── alembic/           # Database Migrations
│   │   ├── app/               # Core Application Logic (Services, APIs)
│   │   └── Dockerfile         # Python Production Container Config
│   └── frontend/              # Next.js Application
│       ├── src/               # React Components, Dashboard Pages, Routing
│       └── Dockerfile         # Next.js Standalone Production Container Config
├── server/                    # Legacy Node.js MVP codebase
├── docker-compose.yml         # Global Orchestration Configuration
└── README.md                  # This File
```

## 📚 Further Reading

For a deep dive into the technical design, database relationships, and container flow, please review the [Architecture Blueprint](./enterprise/ARCHITECTURE.md).

---
*Engineered by Antigravity AI.*
