# AI Interview

AI Interview is a prototype-framework designed to simplify hiring by connecting job seekers and recruiters in one intelligent platform. It combines job discovery, candidate profiles, applications, and AI-powered interview experiences into a single workflow.

## What the app does

The platform helps users:

- Sign up and sign in as either a job seeker or an HR/admin user
- Create and manage professional profiles with skills, experience, and resume uploads
- Browse available jobs and apply for positions
- Take AI-generated interviews and receive evaluation feedback
- Track applications and review candidate information from an admin dashboard

## Main uses

### For job seekers
- Build a complete profile
- Apply to jobs quickly
- Participate in interviews powered by AI
- View application progress and interview status

### For recruiters and HR teams
- Post and manage job openings
- Review candidate applications
- Access applicant details and resumes
- Monitor hiring activity through the admin dashboard

## Key features

- Role-based authentication and user profiles
- Resume upload and profile completion flow
- Job posting and application management
- AI-assisted interview generation and evaluation
- Admin dashboard for recruitment operations
- Modern UI built with Next.js and Tailwind CSS

## Tech stack

- Next.js and React
- TypeScript
- Tailwind CSS
- MongoDB with Mongoose
- Supabase for storage and file handling
- Groq AI SDK for interview-related AI features

## Getting started

1. Navigate to the app folder:
   ```bash
   cd ai-app
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```
4. Open http://localhost:3000 in your browser.

> Make sure the required environment variables for MongoDB, Supabase, and AI services are configured before running the app.
