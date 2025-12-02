# URL Shortener - Frontend

A modern React application built with Vite, TypeScript, TanStack React Query, and Tailwind CSS for shortening URLs with a beautiful, responsive user interface.

## Features

- 🎨 Modern, responsive UI with Tailwind CSS
- ⚡ Fast development with Vite
- 🔄 Data fetching and caching with TanStack React Query
- 📝 TypeScript for type safety
- 🎯 Form validation and error handling
- 💫 Loading states and user feedback

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack React Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Configuration

Make sure your backend API is running and accessible. The frontend connects to the backend API (default: `http://localhost:8080`). Update the API URL in the code if your backend runs on a different port or domain.

### Build

Build for production:

```bash
npm run build
```

The production build will be output to the `dist` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Linting

Run ESLint to check for code issues:

```bash
npm run lint
```

## API Integration

The frontend communicates with the backend API at the following endpoints:

- **POST `/api/shorten`** - Create a short URL from a long URL
  - Request body: `{ "url": "https://example.com/long/url" }`
  - Response: `{ "shortUrl": "...", "shortCode": "...", "longUrl": "..." }`

## Environment Configuration

For production deployments, you may want to configure the API base URL via environment variables. Update `vite.config.ts` to support environment variables if needed.

In this project, the frontend uses **relative** API paths (e.g. `/api/auth/login`), and Vercel rewrites are used to proxy these requests to the backend deployed on Fly.io.

## Deployment (Vercel)

The recommended production deployment for the frontend is **Vercel**.

Key points:

- The frontend is built as a standard Vite app (`npm run build`).
- Vercel serves the static assets from the Vite `dist` output.
- API requests (e.g. `/api/*`) and short URL paths (e.g. `/abcd12`) are forwarded to the Fly.io backend using rewrites.

The repository includes a Vercel configuration file (e.g. `frontend/vercel.json`) that demonstrates these rewrites:

- `"/api/:path*"` → `https://backend-holy-shadow-7671.fly.dev/api/:path*`
- `"/:shortCode([a-zA-Z0-9]{4,8})"` → `https://backend-holy-shadow-7671.fly.dev/:shortCode`

You can either:

- Use this file directly in your Vercel project, or
- Adapt it to point to your own Fly.io app domain or custom domain.

## Components

The application includes the following main components:

- **App** - Main application component with layout and routing
- **UrlShortenerForm** - Form component for URL shortening with validation
- **UI Components** - Reusable UI components (Button, Form, Spinner)

## Development Notes

- The app uses React Query for efficient data fetching and caching
- Form validation ensures URLs are properly formatted before submission
- Error states are handled gracefully with user-friendly messages
- Loading states provide visual feedback during API requests
- The UI is fully responsive and works on mobile and desktop devices

## License

This project is part of the URL Shortener application.
