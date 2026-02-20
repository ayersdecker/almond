# Joi - Voice Assistant PWA

A production-ready Progressive Web App (PWA) for a conversational AI assistant named "Joi" with voice interaction capabilities.

## Features

- 🎤 **Voice Input** - Push-to-talk speech recognition (Web Speech API)
- 🔊 **Voice Output** - Natural text-to-speech via ElevenLabs API
- 💬 **Real-time Chat** - Persistent conversation history via Firebase Firestore
- 🔐 **Authentication** - Google OAuth + Email/Password via Firebase Auth
- 📱 **PWA** - Install on any device, offline support
- 📊 **Status Dashboard** - Memory files viewer, session stats
- 🌙 **Dark Theme** - Clean dark UI optimized for all screen sizes

## Tech Stack

- **React 18** + **TypeScript** + **Expo** (web target)
- **Firebase** (Auth, Firestore, Storage)
- **ElevenLabs** API for text-to-speech
- **Web Speech API** for speech-to-text
- **GitHub Pages** deployment

## Setup

### Prerequisites

- Node.js 18+
- Firebase project
- ElevenLabs API key
- Clawdbot backend URL (optional for testing)

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_ELEVENLABS_API_KEY`
- `EXPO_PUBLIC_CLAWDBOT_URL`

### Development

```bash
npm run web
```

### Build

```bash
npm run build:web
```

## Deployment

Add the environment variables as secrets in your GitHub repository settings, then push to `main` to trigger automatic deployment to GitHub Pages.

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Google provider + Email/Password)
3. Enable Firestore Database
4. Enable Storage
5. Deploy Firestore rules: `firebase deploy --only firestore:rules`

## Troubleshooting

- **Voice input not working**: Web Speech API requires Chrome or Edge browser
- **TTS not working**: Check your ElevenLabs API key and quota
- **Auth failing**: Ensure Firebase Google sign-in is enabled and your domain is in Authorized domains
- **Backend offline**: Set `EXPO_PUBLIC_CLAWDBOT_URL` to your deployed proxy URL (see `functions/README.md`)
- **PWA install prompt**: Must be served over HTTPS
Personal PC to Home Agent Portal - Not Public
