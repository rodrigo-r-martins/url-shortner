# URL Shortener - Frontend

A modern React application built with Vite, TypeScript, TanStack React Query, and Tailwind CSS for shortening URLs with a beautiful, responsive user interface.

## Features

- 🎨 Modern, responsive UI with Tailwind CSS
- ⚡ Fast development with Vite
- 🔄 Data fetching and caching with TanStack React Query
- 📝 TypeScript for type safety
- 🎯 Form validation and error handling
- 💫 Loading states and user feedback
- 🔗 Copy-to-clipboard functionality

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

## Development Notes

- The app uses React Query for efficient data fetching and caching
- Form validation ensures URLs are properly formatted before submission
- Error states are handled gracefully with user-friendly messages
- Loading states provide visual feedback during API requests
- The UI is fully responsive and works on mobile and desktop devices

## License

This project is part of the URL Shortener application.
