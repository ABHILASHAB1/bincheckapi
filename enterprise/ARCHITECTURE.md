# RemitWise Enterprise Architecture Blueprint

## System Overview

RemitWise Intelligence Platform is a cloud-native, microservices-driven SaaS application designed to provide high-grade global payment intelligence, including merchant verification, BIN decoding, and ISO-standard routing validation.

The system is deployed using Docker Compose for complete local orchestration.

## Tech Stack Overview

### 1. The Intelligence Core (Backend)
* **Framework**: Python FastAPI
* **Database**: PostgreSQL 15 (Relational Data & JSONB payloads)
* **ORM**: SQLAlchemy 2.0 with Alembic for Migrations
* **Purpose**: Serves as the central nervous system. It exposes highly optimized RESTful APIs for Merchant CRUD, BIN validation algorithms, and Routing/IBAN modulus calculations.

### 2. The Presentation Layer (Frontend)
* **Framework**: Next.js 14 (App Router)
* **Styling**: Tailwind CSS & Shadcn UI Components
* **Icons**: Lucide React
* **Purpose**: Provides a beautifully crafted, dark-mode-first dashboard interface. It rapidly consumes the FastAPI endpoints to render interactive data tables, validation forms, and detailed merchant intelligence profiles.

### 3. The Legacy Node Application
* **Framework**: Express.js
* **Database**: SQLite
* **Purpose**: The original minimum viable product (MVP) serving basic banking checks. Maintained in the `/server` directory for backward compatibility and scraped data assets.

## Database Schema Highlights

The Postgres schema engineered via SQLAlchemy is robust enough for massive scale:

1. **Merchant Domain**:
   - `Merchant`, `MerchantLocation`, `MerchantBranch`, `MerchantAlias`, `MerchantCategory`
2. **Intelligence & Enrichment**:
   - `MerchantAI`, `MerchantRisk`, `MerchantVerification`, `MerchantContact`
3. **Platform Infrastructure**:
   - `User`, `Role`, `ApiKey`, `Subscription`

*All models support UUID primary keys, exact timestamping, and JSONB fields for unstructured AI intelligence data.*

## Container Architecture

```mermaid
graph TD
    Client((Web Browser)) <-->|HTTP: 3000| Frontend[Next.js Frontend\n(Node:20-alpine)]
    Client <-->|HTTP: 8000| Backend[FastAPI Backend\n(Python:3.12-slim)]
    Client <-->|HTTP: 5000| Legacy[Node.js Server\n(Express MVP)]
    
    Frontend <-->|REST API| Backend
    Backend <-->|SQLAlchemy/psycopg2| DB[(PostgreSQL 15)]
    Legacy <-->|sqlite3| SQLite[(SQLite File)]
```

## Deployment Flow
1. `docker compose up -d`
2. Postgres boots and signals health check.
3. FastAPI boots, triggers `entrypoint.sh`.
4. Alembic detects changes, generates schema, upgrades Postgres DB to head.
5. Uvicorn server starts serving traffic.
6. Next.js statically built standalone image boots up on port 3000.
