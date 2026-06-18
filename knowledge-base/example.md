# Example Knowledge Base

## What is this?

This is an example knowledge base entry. Replace this file with your own `.md`
files containing the information you want the FAQ tool to search through —
product details, pricing, eligibility, policy terms, support answers, and so on.

## How does it work?

Each `.md` file is split into chunks by its `## ` (H2) headings. The `# ` (H1)
title gives each chunk context. The `faq` tool runs a semantic search over
these chunks and answers the user's question from the best matches.

## How do I update it?

Add or edit `.md` files in this `knowledge-base/` directory, then run
`bun run kb:ingest`. Ingestion is destructive — it replaces all existing
chunks for the environment with the current contents of this directory.
`WANIWANI_API_KEY` must be set in the environment.
