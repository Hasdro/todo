# Simple Todo App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimalist, responsive Todo web app in Next.js, commit and push to a new GitHub repository, and deploy to Vercel.

**Architecture:** Client-side React app with localStorage synchronization, clean responsive layout using Tailwind CSS, supporting adding, toggling, filtering, and deleting tasks.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide React, Vitest + React Testing Library for unit verification.

**Spec:** User request: "create a very simplistic one", "deploy it on vercel and push it to github".

## Global Constraints

- Modern minimalist clean UI with dark/light background adaptation.
- Local storage persistence for tasks across refreshes.
- Zero server database setup required to run or deploy.
- Vercel-ready build without errors or warnings.
- GitHub repository created and linked to origin.

## Review Focus

1. Empty todo submission: Whitespace or empty input must not create a todo.
2. Persistence: Tasks and completed status must persist across page reload.
3. Filtering: Switching between All, Active, Completed must accurately filter lists.
4. Edge cases: Deleting items should not leave corrupted localStorage state.
5. Vercel build compatibility: `npm run build` must succeed with zero TypeScript or ESLint errors.

---

### Task 1: Project Scaffolding
**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts` or Tailwind v4 setup, `postcss.config.mjs`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`
**Steps:**
- [ ] Initialize Next.js project with TypeScript and Tailwind CSS.
- [ ] Install `lucide-react` for icons and `clsx` / `tailwind-merge` if needed.
- [ ] Verify local dev/build script runs cleanly.

### Task 2: Core Todo Features & UI
**Files:**
- Create: `app/components/TodoApp.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
**Steps:**
- [ ] Implement Todo item type definition (`id`, `text`, `completed`, `createdAt`).
- [ ] Implement state management with `localStorage` hydration and updates.
- [ ] Build UI: Header, input form with Add button, Todo item list with check/toggle and delete buttons, filter tabs (All, Active, Completed), item counter, and Clear Completed button.
- [ ] Verify UI responsiveness and styling.

### Task 3: Unit Testing & Verification
**Files:**
- Create: `vitest.config.ts`
- Create: `app/components/__tests__/TodoApp.test.tsx`
**Steps:**
- [ ] Install Vitest, jsdom, and React Testing Library.
- [ ] Write tests covering adding todos, toggling complete, deleting, and filtering.
- [ ] Run `npm run test` and `npm run build` to verify all tests pass and build succeeds.

### Task 4: Git Repository & GitHub Setup
**Files:**
- Create: `.gitignore`, `README.md`
**Steps:**
- [ ] Initialize git repo: `git init`, set branch `main`.
- [ ] Commit all code with a clean commit message.
- [ ] Use `gh repo create` to create a GitHub repo and push `main`.

### Task 5: Vercel Deployment
**Steps:**
- [ ] Link Vercel project with `vercel link`.
- [ ] Deploy with `vercel deploy --prod -y` using the authenticated Hasan Hobby account.
- [ ] Retrieve and verify the live production URL.
