# AI Task Tracker

A task tracker with a built-in AI chat assistant. Type things like "เพิ่มงานประชุมพรุ่งนี้บ่ายสอง" or "วันนี้มีงานอะไรบ้าง" and the assistant reads/writes your real task list through tool use.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Claude API (`@anthropic-ai/sdk`) with tool use for `list_tasks`, `add_task`, `complete_task`, `delete_task`
- Tasks persisted to `data/tasks.json` (file-based, no external database)

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and set ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000 — the left panel is the task list, the right panel is the chat.

Without `ANTHROPIC_API_KEY` set, the task list (add/complete/delete) still works; only the chat endpoint requires the key.
