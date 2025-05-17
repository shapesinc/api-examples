## Shapes Chat

A modern, responsive chat application built for users to connect  with their shapes in Next.js. Supports vision, image generation, voice etc...

Heres the demo:
https://shapeweb.vercel.app/
## Features

- **Chat Interface**: Send text, images (jpg, png), and audio (mp3, wav, ogg) with Markdown support (e.g., *italics*).
- **Model Selection**: Choose from shape-based models via a dropdown.
- **Code Sharing**: Send code blocks (e.g., ```code```) with a copy button (`Copy`) for easy copying.
- **File Uploads**: Upload files to Vercel Blob (1GB limit, 128 kB used), with deletion after sending.
- **Conversation Management**: Save, load, and delete conversations with shape-generated names (based on last 5 messages).
- **Responsive Design**:
- **Voice Recording**: Record and send audio directly.
- **Local Storage**: Persist conversations locally.

## Tech Stack

- **Frontend**: Next.js 14.2.3, React 18
- **Styling**: CSS with responsive breakpoints
- **Dependencies**:
  - `@vercel/blob`: File uploads
  - `react-markdown`: Markdown rendering
  - `react-copy-to-clipboard`: Code copying
  - `react-icons`: Icons (e.g., `FaCopy`, `FaTrash`)
  - `openai`: Shape model integration
- **Deployment**: Vercel

## Setup

1. **Clone Repository**:
   ```bash
   cd shapes-chat
   ```
Install Dependencies:
```bash
npm install
```
Configure Environment:
Edit `.env`:
```plaintext
SHAPES_API_KEY=your-api-key
NEXT_PUBLIC_SHAPES_USERNAMES=shape1,shape2,shape3
```
- Go to Storage in the project menu
- Click Create Database and choose Blob and follow the steps.
- After you've created the database just continue with the steps below

Run Development Server:
```bash
npm run dev
```
Open http://localhost:3000.

Build for Production:
```bash
npm run build
npm run start
```
Deployment

Vercel Setup:
- Push to a GitHub repository.
- Import to Vercel and add environment variables (`SHAPES_API_KEY`, `NEXT_PUBLIC_SHAPES_USERNAMES`) in Vercel dashboard (Settings > Environment Variables).
- Deploy via Vercel CLI or dashboard.

### Submit issues or pull requests. For design tweaks (e.g., color adjustments), describe changes clearly.

Todo:
- add eraser
- add ability to edit messages
- other idk
License
MIT License idk!
