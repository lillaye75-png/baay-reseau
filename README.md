# Baay Réseau - SaaS ERP for Boutique & Tech Retailers

## Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** Next.js 14, React, Tailwind CSS
- **AI:** OpenAI GPT-4o-mini for WhatsApp NLP
- **Payments:** Wave, Orange Money
- **Infra:** Docker Compose

## Quick Start

```bash
# Clone and setup
cp .env.example .env
# Edit .env with your API keys

# Run with Docker
docker-compose up --build

# Or run locally
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload

cd frontend && npm install && npm run dev
```

## Features

- Multi-tenant ERP with role-based access
- WhatsApp AI assistant (Wolof/French/English)
- Real-time POS with product search
- Credit tab management (borom dënn)
- Wave & Orange Money integration
- Smart reorder alerts
- Mobile-first responsive design
- CFA currency support

## API Docs

Visit `http://localhost:8000/docs` for Swagger documentation.
