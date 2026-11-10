# Movie Memory

Built a movie trivia app where users can sign in with Google, select their favorite movie, and generate AI-powered trivia about it using OpenAI. Users can explore interesting facts, generate new facts, and change their favorite movie at any time to discover trivia about their new choice.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, PostgreSQL, Prisma, NextAuth v5, and OpenAI.

---

## Prerequisites

Before getting started, make sure you have the following:

- Node.js 20 or later
- PostgreSQL 
- Google OAuth credentials
- An OpenAI API key with available billing credits 

## Setup instructions

Clone the repository and install the dependencies:

```bash
git clone <repo-url>
cd movie-memory
npm install
cp .env.example .env
```

Add your credentials and environment variables to the `.env` file.

## Database Migration

Run the database migrations:

```bash
npx prisma migrate dev --name init
```

Then start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Running Tests

Run the test suite using:

```bash
npm test
```
---

## Required Environment Variables

Add the following variables to your .env file:
- DATABASE_URL – Your PostgreSQL connection string.
- AUTH_SECRET – Generate one by running openssl rand -base64 32 in your terminal.
- AUTH_URL – Use http://localhost:3000 for local development.
- AUTH_GOOGLE_ID – Get it from Google Cloud Console under APIs & Services → Credentials.
- AUTH_GOOGLE_SECRET – Available in the same Google Cloud Console section.
- OPENAI_API_KEY – Get it from https://platform.openai.com/. Your account needs available billing credits.
## Google OAuth Setup

Go to Google Cloud Console and create an OAuth 2.0 Client ID. Select Web Application as the application type.

Under Authorized redirect URIs, add:

http://localhost:3000/api/auth/callback/google

Copy the generated Client ID and Client Secret into your .env file as AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.

That's all you need to configure Google sign-in for local development.


## Project Layout

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   — NextAuth catch-all
│   │   ├── me/route.ts                   — GET current user
│   │   ├── me/movie/route.ts             — PUT update movie
│   │   ├── fact/route.ts                 — GET generate fact
│   │   └── onboard/route.ts              — POST first-time setup
│   ├── dashboard/page.tsx
│   ├── onboarding/page.tsx
│   └── page.tsx                          — landing / sign-in
├── components/
│   ├── DashboardClient.tsx               — all client-side interactivity
│   ├── OnboardingForm.tsx
│   └── SignInButton.tsx / SignOutButton.tsx
├── lib/
│   ├── api.ts                            — typed fetch wrapper
│   ├── auth.ts + auth.config.ts          — split for edge/node compat
│   └── prisma.ts
├── proxy.ts                              — route protection (renamed from middleware.ts in Next 16)
└── __tests__/
    ├── api-client.test.ts
    └── movie-edit.test.tsx
```

---


# Architecture Overview

## Application Flow

When a user opens the application, they are prompted to sign in with their Google account. After signing in, the application checks whether they have already selected a favorite movie.

First-time users are taken to the onboarding page, where they can choose their favorite movie. Once they save their selection, they are redirected to the dashboard.

Returning users who have already completed onboarding are taken directly to the dashboard.

The dashboard displays their selected movie along with its trivia. Users can update their favorite movie at any time or generate new facts about their current selection.

The application checks the user's onboarding status directly from the database whenever a page loads instead of relying on the JWT. This is important because the JWT can contain an outdated onboarding status after the user completes the setup process. Reading the latest value from the database ensures that users are redirected correctly and prevents unnecessary redirect loops.

## Authentication Configuration

The authentication configuration is split between `auth.config.ts` and `auth.ts` to keep the middleware compatible with the Edge Runtime.

`auth.config.ts` contains the basic authentication configuration and is used by the middleware (`proxy.ts`). It does not import Prisma or any database-related dependencies.

`auth.ts` handles the full authentication setup in the Node.js runtime, including the Prisma adapter and database operations.

This separation is necessary because Prisma relies on Node.js APIs that are not available in the Edge Runtime. Importing Prisma into the middleware can cause runtime errors. Keeping these configurations separate allows the application to use Google authentication and persist user data in PostgreSQL without running into Edge Runtime compatibility issues.

## API Client (`src/lib/api.ts`)

All API requests are handled through a shared client in `src/lib/api.ts`. Rather than writing separate `fetch` calls throughout the application, components use the same client to communicate with the backend.

The client includes a private `request<T>()` method that handles HTTP responses, checks for errors, and extracts error messages from the response body when available. If a request fails, it throws an error containing the message and HTTP status code.

This keeps API communication consistent across the application and makes future changes to request handling or error handling easier to maintain.

## Optimistic Movie Editing

Users can update their favorite movie directly from the dashboard without navigating to another page.

When a user clicks Edit, they can change the movie name and save their selection. The dashboard updates immediately instead of waiting for the server response. This is handled through optimistic updates.

If the request succeeds, the updated movie remains displayed. If something goes wrong, the application restores the previous movie name and displays an error message.

The `FactDisplay` component is rendered with `key={movie}`. Whenever the selected movie changes, React creates a fresh instance of the component. This also resets its internal fact cache, ensuring that facts from the previous movie are not displayed for the new selection.

## Fact Caching

The application uses a `useRef` to temporarily store the most recently generated fact.

When a user clicks **Refresh Fact**, the app checks whether a fact was fetched within the last 30 seconds. If a cached fact is available, it displays that fact instead of making another API request.

Users can also click **New Fact** to generate a completely different fact. This action bypasses the cache and requests fresh trivia from OpenAI.

The cache is stored in memory using `useRef`, rather than in React state or localStorage. This keeps the implementation simple and means cached facts are cleared when the page is refreshed. Since the cache is only intended to avoid repeated requests within a short period, persistent storage isn't necessary.


## Variant Chosen

I chose Variant B (Frontend/API-Focused) because most of the interesting challenges in this project were on the frontend. This included handling API requests with proper TypeScript types, updating the UI immediately when a user changes their favorite movie, and reverting those changes if the request fails.

I also focused on making sure the fact cache resets correctly when a user switches movies. These areas required careful handling because small mistakes could lead to inconsistent UI behavior or outdated facts being displayed. They were also easier to test and verify through automated tests and manual checks in the browser.


## Key Tradeoffs

**\*\*Using `useRef` for fact caching instead of `useState` or `localStorage`\*\***

I used `useRef` to store the most recently fetched fact because the cache only needs to exist while the page is open. It resets automatically when the page is refreshed, doesn't create stale data across browser tabs, and doesn't require any additional storage logic. For this application, keeping the cache in memory was sufficient.

**\*\*Using a parent callback for optimistic updates instead of a reducer\*\***

I used a parent callback to update the selected movie immediately when the user saves a change. This was simpler than introducing a reducer because the application only needs to manage one main value. A reducer would make more sense if the state became more complex or involved multiple related updates.

**\*\*Using the `key` prop to reset the fact cache\*\***

I used React's `key` prop to reset the fact component whenever the user changes their favorite movie. Changing the key causes React to unmount the existing component and create a new one, which automatically clears the cached fact. This avoids additional cleanup logic. The tradeoff is that the component remounts completely, but that's not a concern for a relatively lightweight component like this one.

**\*\*Choosing NextAuth v5 over v4\*\***

I chose NextAuth v5 because it provides better support for the Next.js App Router and a cleaner `auth()` API. The main tradeoff was that v5 was still in beta, so the documentation was less complete and some APIs differed from v4. Since the application was built around the App Router, I felt v5 was the better fit.

**\*\*Keeping every generated fact in the database\*\***

Every generated fact is saved in the database rather than replacing or deleting the previous one. This keeps the implementation simple and preserves the user's trivia history. The downside is that the database will continue to grow over time, so a production version would need a retention policy or cleanup process.


## What I'd Improve With More Time

**\*\*Add rate limiting to `/api/fact`\*\***

Currently, users can click the fact generation button repeatedly, which could result in unnecessary OpenAI API requests and increased costs. I'd add a per-user cooldown of 60 seconds, stored in the database, to prevent excessive requests while keeping the feature easy to use.

**\*\*Add a Fact History section\*\***

The application already saves every generated fact in the `Fact` table, but users cannot currently browse their previous facts. I'd add a history section to the dashboard where users can view previously generated trivia instead of seeing only the latest fact.

**\*\*Add end-to-end testing\*\***

The existing unit tests cover API client error handling and the optimistic update and revert logic. However, they don't test the complete user journey. I'd use Playwright to test the entire flow, from Google sign-in and movie selection to viewing facts and updating a favorite movie.

**\*\*Manage Fact table growth\*\***

Every generated fact is currently stored in the database, with no limit or cleanup mechanism. This is fine for a small project, but the table could grow significantly over time. For a production application, I'd introduce a retention policy or scheduled cleanup job to remove older records.


## AI Tools Used

- I used GitHub Copilot throughout development, mainly for code completion and repetitive tasks such as writing Tailwind CSS classes, TypeScript types, and Prisma schema fields. It helped speed up development without taking away the need to understand the code.
- I also used it as a reference when troubleshooting specific issues, particularly with NextAuth v5 session callbacks and the compatibility between Prisma and the Edge Runtime. Debugging the Edge Runtime issue helped me arrive at the decision to separate `auth.config.ts` from `auth.ts`.
- For testing, I created the initial test structure myself and used Copilot to help with repetitive test setup and boilerplate. I then reviewed and adjusted the assertions based on the actual DOM output.
- I used Claude briefly to sanity check the optimistic update revert logic and the `key`-prop cache invalidation approach before committing to them.
- The main architectural decisions, including the API client design, optimistic updates, cache invalidation using the `key` prop, and overall application structure, were made before implementation. I used AI tools primarily to speed up development and help troubleshoot issues rather than make those decisions for me.
