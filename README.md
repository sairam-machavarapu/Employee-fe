# Employee Management Frontend

React 19 single-page application built with Vite.

## Local development

```powershell
npm install
npm run dev
```

The Vite development server proxies `/api` to `http://127.0.0.1:8000`.

To use a deployed backend locally, copy `.env.example` to `.env.local` and set:

```dotenv
VITE_API_URL=https://your-api-service.onrender.com
```

## Production build

```powershell
npm run build
npx vite preview
```

## Vercel deployment

Import the repository into Vercel and configure:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | `fe` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Add this Vercel environment variable for Production and Preview:

```dotenv
VITE_API_URL=https://your-api-service.onrender.com
```

Replace the value with the deployed Render backend URL without a trailing slash, then deploy. If the value changes, redeploy the frontend. `vercel.json` provides the fallback required for client-side routes.
