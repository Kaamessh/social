# Supagram - Supabase React Frontend

A premium, glassmorphism-inspired React frontend for Supabase.

## Vercel Deployment Instructions

### 1. Push to GitHub
Initialize a git repository, commit your code, and push it to a new GitHub repository.

### 2. Connect to Vercel
1. Log in to [Vercel](https://vercel.com/).
2. Click **"New Project"**.
3. Import your GitHub repository.

### 3. Configure Environment Variables
In the Vercel **Project Settings > Environment Variables** section, add the following:

| Name | Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon Key |

### 4. Deploy
Vercel will automatically detect the Vite build settings. Click **Deploy**.

## Local Development
1. `npm install`
2. Configure `.env` with your Supabase keys.
3. `npm run dev`
