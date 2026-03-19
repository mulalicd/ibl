# IBL Planer v2.0 — Vercel Deployment Checklist

## Before deploying to Vercel, set these Environment Variables
## in Vercel Dashboard → Project → Settings → Environment Variables

### Gemini API Keys (all 8 required)
GEMINI_KEY_1=
GEMINI_KEY_2=
GEMINI_KEY_3=
GEMINI_KEY_4=
GEMINI_KEY_5=
GEMINI_KEY_6=
GEMINI_KEY_7=
GEMINI_KEY_8=

### Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

### Auth
APP_PIN=          (4-8 digit PIN for teachers)
PIN_SESSION_SECRET= (random 32+ char string)

### App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

## Deployment Steps
1. Push code to GitHub: https://github.com/mulalicd/ibl
2. Go to https://vercel.com → New Project
3. Import from GitHub: mulalicd/ibl
4. Add ALL environment variables above
5. Click Deploy

## Post-deployment verification
- [ ] Login page loads at /login
- [ ] PIN authentication works
- [ ] Chat page loads at /chat
- [ ] Gemini generates a plan (test with: Mathematik, 3, Zahlen, 45)
- [ ] DOCX export downloads a file
- [ ] Dashboard shows saved plans
- [ ] Plan detail page opens correctly
- [ ] Logout works