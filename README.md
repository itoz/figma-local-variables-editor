# Figma Local Variables Editor

This is a web application that allows you to edit Figma local variables directly from your browser. Built with [Next.js](https://nextjs.org).

## Features

- View and edit Figma local variables
- Real-time preview of variable changes
- Bulk edit support
- Variable collection management

## Prerequisites

- Node.js 18.0.0 or later
- pnpm 8.0.0 or later
- Figma account with access to the file you want to edit
- Figma access token

## Getting Started

1. Clone this repository
2. Copy the environment variables template:
   ```bash
   cp .env.local.example .env.local
   ```
3. Set up your environment variables in `.env.local`:
   ```
   FIGMA_TOKEN=your_figma_access_token
   ```
4. Install dependencies:
   ```bash
   pnpm install
   ```
5. Run the development server:
   ```bash
   pnpm dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) with your browser

## Environment Variables

| Variable      | Description                                                                                     | Required |
| ------------- | ----------------------------------------------------------------------------------------------- | -------- |
| `FIGMA_TOKEN` | Figma personal access token **with scopes:** File content → Read-only, Variables → Read & Write | Yes      |

## How to get Figma Access Token

1. Log in to your Figma account
2. Go to Settings > Account > Personal access tokens
3. Click "Generate new token"
4. Give your token a name and copy it
5. Paste the token in your `.env.local` file

### Required Token Scopes

When generating the token, enable the following permissions:

| API Scope        | Level        |
| ---------------- | ------------ |
| **File content** | Read-only    |
| **Variables**    | Read & Write |

Without these scopes the application will not be able to fetch or update variables.

## Development

The project structure follows Next.js 14 App Router conventions:

- `app/` - Next.js application routes and API endpoints
- `components/` - React components
- `lib/` - Utility functions and API clients

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Figma API Documentation](https://www.figma.com/developers/api)
