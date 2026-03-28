# 🧠 RecallX: Smart Knowledge Retention

> **Never Forget What You Learn.**

RecallX is a modern, game-style web application designed to supercharge your learning through intelligent spaced repetition, beautiful analytics, and cutting-edge Google Gemini AI integration. 

Say goodbye to forgetting important concepts and hello to a structured, data-driven approach to mastering any topic.

![RecallX Demo](https://img.shields.io/badge/Status-Mission_Ready-success?style=for-the-badge)

## ✨ Core Features

### 🚀 Game-Style Introduction & UI
* **Cinematic Onboarding**: A 4-phase animated intro (Boot, Hero, Features, Ready) built with particle canvas effects, floating orbital animations, and slick `framer-motion` transitions.
* **Premium Dashboard**: A beautifully crafted dark-mode dashboard with interactive charts, glassmorphism cards, and glowing call-to-action buttons.

### 🤖 Google Gemini AI Integration
RecallX acts as your personal study companion using the powerful `gemini-2.0-flash` model:
* **AI Learning Coach (Dashboard)**: Analyzes your revision history, streak data, and overdue topics to detect your 'learning pace' (e.g., 🚀 Crushing It, ⚠️ Falling Behind). It delivers highly personalized tactical advice and prioritizes what you should study next.
* **✨ AI Topic Summary (Revision)**: Need a quick refresher? Click the AI Summary button on any detailed topic to generate concise, bulleted recaps featuring **Key Concepts**, **Things to Remember**, and **Study Tips**.

### 🗓️ Spaced Repetition Engine
* **Dynamic Scheduling**: Automatically calculates optimal intervals (1, 2, 5, 10, 20, 30 days) to revise topics just as you are about to forget them.
* **Retention Tracking**: Topics are graded as **Weak**, **Medium**, or **Strong** based on the number of successful revisions.
* **At-Risk Alerts**: The dashboard flags topics that are overdue or slipping from memory.

### 🎴 Smart Flashcards & Active Recall
* **Distraction-Free Mode**: Focused flip-card UI for testing yourself on concepts without glancing at the answers too early.
* **Quick Actions**: Mark topics as "Done" instantly or deep-dive into the revision history.

### 📄 Document & Image Extraction
* **PDF & OCR Support**: Upload PDFs or images when creating a topic. The app automatically extracts the text and uses AI to summarize the contents into your note's description.

### 📊 Deep Analytics
* **Visual Progress**: See your revision frequency graphed out day by day.
* **Streak Tracking**: Maintain a daily learning streak to stay motivated (🔥 count).
* **Topic Distribution**: Determine the ratio of strong vs. weak topics at a glance to identify knowledge gaps.

---

## 🛠️ Technology Stack

* **Frontend Framework**: React + Vite
* **Styling**: Vanilla CSS (CSS Variables, Flexbox/Grid, Keyframe Animations)
* **Animations**: Framer Motion
* **Charts**: Chart.js + React-Chartjs-2
* **Icons**: React Icons (Heroicons)
* **AI Provider**: Google Gemini REST APIs (`gemini-2.0-flash`)
* **State Management**: React Context API (`TopicContext`, `AuthContext`)
* **Storage**: `localStorage` (for persistent data) and `sessionStorage` (for Intro Page state and AI caching)

## ⚡ Getting Started

1. Set up your Gemini API key inside `src/utils/geminiService.js`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Navigate to `http://localhost:5173` to start learning!
