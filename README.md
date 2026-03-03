# Conduit AI — Mobile App

> Cross-platform mobile app for Conduit AI, built with React Native and Expo.

**Platform:** iOS & Android · **Status:** ~90% Complete

## Overview

The Conduit AI mobile app gives service business owners full access to their AI voice agent platform on the go. Built with React Native (Expo), the app features a premium design language with glassmorphism effects, shimmer animations, waveform visualizations, and particle backgrounds.

## Tech Stack

- **Framework:** React Native (Expo)
- **Navigation:** React Navigation
- **Backend:** FastAPI (Python) via REST API
- **Authentication:** Supabase Auth
- **Animations:** React Native Animated API, Shimmer effects

## Screens (8+)

1. **Welcome Walkthrough** — Animated onboarding flow
2. **Login** — Secure authentication with Supabase
3. **Signup** — New user registration
4. **Onboarding** — Business setup and AI agent configuration
5. **Dashboard** — Real-time metrics with animated visualizations
6. **Leads** — Lead list with search, filter, and detail view
7. **Analytics** — Visual charts and performance tracking
8. **Settings** — Profile management, integrations, preferences
9. **Lead Detail** — Full lead info with call transcript

## Design Features

- **Glassmorphism UI** — Frosted glass effect cards and overlays
- **Shimmer Loading** — Premium skeleton loading states
- **Waveform Visualizations** — Audio-style visual elements
- **Particle Backgrounds** — Animated floating particles
- **Dark Theme** — Modern dark color palette throughout

## Architecture

The app connects to the live FastAPI backend with mock data fallbacks for offline/development use.

 Mobile App (Expo/React Native) → REST API → FastAPI Backend (Railway) → Supabase (Auth/DB)
## Author

**Luis Garcia** — Solo founder & full-stack developer
[conduitai.io](https://conduitai.io) · [luis@conduitai.io](mailto:luis@conduitai.io)

*Premium mobile experience built from scratch by a solo developer using React Native and Expo.*
