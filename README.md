# Patmos — AI Biblical Research Platform

**An autonomous AI-powered platform for serious biblical research**, built for literal exegesis, dispensational theology, and deep scriptural analysis based exclusively on the **King James Version** and **Reina Valera 1865**.

[Live Demo](https://patmosresearch.com) • [Report Issue](https://github.com/leonardoxmoreno1988/sion/issues)

## ✨ Key Features

- Advanced **RAG (Retrieval-Augmented Generation)** system with semantic vector search
- Real-time token streaming using GPT-4o
- Intelligent paywall (3 free queries per day)
- Subscription management with **Lemon Squeezy**
- Clean, fast, and focused user interface
- Strong theological framework: dispensational, pre-tribulational, and literal

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Database & Auth:** Supabase (PostgreSQL + Edge Auth)
- **AI:** OpenAI (gpt-4o + text-embedding-3-small)
- **Payments:** Lemon Squeezy
- **Styling:** Tailwind CSS v4
- **Vector Search:** Native Supabase RPC with pgvector

## Architecture Highlights

- Efficient real-time streaming with proper token control
- Smart rate limiting + subscription verification
- Asynchronous history persistence
- Highly optimized system prompt to reduce hallucinations
- Native vector search directly in PostgreSQL

## Project Purpose

Patmos was built as a **portfolio project** to demonstrate my ability to:

- Design and develop complete, production-ready SaaS products
- Integrate advanced AI systems (RAG + Streaming)
- Implement full user flows: authentication, payments, and paywalls
- Deliver high-quality full-stack applications with excellent UX/UI
