# Patmos — Autonomous Full-Stack AI Knowledge Platform

An uncompromising, high-fidelity AI platform engineered to explore dense semantic knowledge mapping, vector search, and strict scriptural exegesis. Patmos bridges advanced AI orchestration with fine-tuned design systems, featuring a custom Retrieval-Augmented Generation (RAG) engine, deep relational access controls, and real-time token streaming.

Built from scratch to demonstrate the absolute convergence of rigorous product strategy, full-stack systems engineering, and elite visual craft.

## 🚀 Technical Architecture Overview

Patmos is structured with a modern, high-performance edge infrastructure optimized for low latency, secure data boundaries, and reliable resource consumption.

### 1. Advanced LLM & RAG Orchestration (`/app/api/chat/route.ts`)
* **Real-Time Streaming:** Leveraging OpenAI's `gpt-4o` via custom `ReadableStream` delivery, ensuring instantaneous Time to First Token (TTFT) and seamless user interface updates.
* **Semantic Vector Search:** Integrates `text-embedding-3-small` to translate dynamic user inquiries into high-dimensional vector space. Executes similarity matching directly inside PostgreSQL via a native remote procedure call (`supabase.rpc('match_documents')`) utilizing fine-tuned cosine similarity thresholds.
* **Context Preservation & Formatting:** Dynamically structures retrieved text segments with explicit metadata attributes (Resource, Type, Author), feeding a highly rigid, deterministic System Prompt designed to eliminate hallucinations and enforce strict typographic compliance (`pre-wrap` container layout rules).

### 2. Infrastructure, Security, & Paywall Guards
* **Serverless Edge Auth:** Utilizes `@supabase/ssr` for secure, cookie-based session management directly aligned with Next.js App Router server-side boundaries.
* **Optimized Database Aggregations:** Implements an ultra-fast, server-side payload gate that queries database entry headers (`head: true`) for daily usage metrics, enforcing rate limits and paywall structures prior to execution without dragging heavy JSON data strings across the network.
* **Transactional State Persistence:** Defers heavy transactional writing until the streaming channel successfully closes, cleanly persisting interaction history to Supabase asynchronously to maintain an uninterrupted user experience.

### 3. Specialized Data Processing & Frontend Architecture
* **Archaic Format Parsing:** Incorporates specialized text parsing (`usfm-js`) capable of ingestion and structuring of raw, non-standard linguistic manuscripts into queryable database entries.
* **Modern Stack Boundaries:** Engineered using **Next.js 16**, **React 19**, and **Tailwind CSS v4** to leverage cutting-edge rendering capabilities, server component layouts, and highly modular design token management.

## 🛠️ Tech Stack & Core Dependencies

* **Core Framework:** Next.js 16 (App Router), React 19, TypeScript
* **Styling & UI Engine:** Tailwind CSS v4, PostCSS, Autoprefixer
* **AI & Embeddings:** OpenAI SDK (`text-embedding-3-small`, `gpt-4o`), Vercel AI SDK Core (`ai`, `@ai-sdk/react`)
* **Backend & Database:** Supabase Postgres, GoTrue Auth (`@supabase/ssr`), Database RPCs
* **Payment & Infrastructure:** Stripe, Paddle Node SDK, Upstash Redis Core
* **Text Parsers & Utilities:** `usfm-js`, `react-markdown`, `remark-gfm`

## 💎 Design-To-Code Philosophy

Patmos is not just a layout; it is a living system. Every interface interaction, hover state, error containment, and stream delivery block is designed with strict system predictability. It represents a deep understanding of frontend rendering rules, relational constraints, and API safety nets, eliminating the friction between design intent and engineering execution.
