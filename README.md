<div align="center">

# 🛡️ DriftGuard

### Behavioral Version Control for AI

*Fingerprint, diff, and gate AI deployments. Catch behavioral regressions before your users do.*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://typescriptlang.org)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-orange?logo=google)](https://ai.google.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[Live Demo](https://driftguard.vercel.app) · [Documentation](#architecture) · [Getting Started](#quick-start)

</div>

---

## The Problem

AI models get updated. **Their behavior changes.** And nobody notices until users complain.

- A support bot starts hallucinating after a model swap
- A code assistant becomes less technical after fine-tuning
- A chatbot's refusal rate spikes silently after a system prompt change

**There's git for code, but nothing for AI behavior.** DriftGuard changes that.

## The Solution

DriftGuard creates a **behavioral fingerprint** of every AI deployment and diffs it against previous versions — exactly like `git diff` but for AI behavior. When regressions are detected, deployments are blocked.

