# Oshikatsu App

A personal notification app for "Aogiri High School" VTuber livestreams. This app checks for upcoming streams and sends notifications to your device.

## Features

- **Stream Tracking**: Automatically fetches upcoming streams from YouTube.
- **Notifications**: Get notified before your favorite member starts streaming.
- **Member Filtering**: Choose which members to receive notifications for.
- **Auto-Update**: GitHub Actions workflow automatically updates the stream schedule every 30 minutes.

## Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Backend/API**: YouTube Data API v3 (Direct integration + JSON hosting via GitHub Pages)

## Setup Instructions

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Copy `.env.example` to `.env` and add your YouTube API Key.
    ```bash
    cp .env.example .env
    ```
    Edit `.env`:
    ```
    YOUTUBE_API_KEY=your_api_key_here
    ```

3.  **Run Locally**
    ```bash
    npx expo start
    ```

## GitHub Actions Setup (Auto-Update)

To enable the automatic stream schedule updates, you need to configure a secret in your GitHub repository.

1.  Go to your repository on GitHub: `https://github.com/soux369/oshikatsu-app`
2.  Navigate to **Settings** > **Secrets and variables** > **Actions**.
3.  Click **New repository secret**.
4.  **Name**: `YOUTUBE_API_KEY`
5.  **Secret**: Paste your YouTube Data API Key.
6.  Click **Add secret**.

The workflow `.github/workflows/update-streams.yml` will now run every 30 minutes to keep `streams.json` updated.
