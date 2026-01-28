# Google Sheets ↔ MySQL Sync System

A bi-directional synchronization system that keeps Google Sheets and a MySQL database in sync using webhooks, with conflict handling and idempotent updates.

## 🔧 Tech Stack
- Backend: Node.js + Express
- Database: MySQL
- Frontend: React + Vite + Tailwind CSS
- Integration: Google Apps Script (onEdit trigger)

## 🚀 Features
- Real-time Sheet → DB sync
- Version-based idempotency
- Loop prevention using source tracking
- Conflict handling (Last Write Wins)
- Live UI dashboard to monitor data

## 🧠 How It Works
1. User edits a Google Sheet cell
2. Apps Script `onEdit` fires
3. Webhook hits backend
4. Backend updates MySQL
5. UI fetches latest DB state

## 📊 Demo Flow
- Edit Google Sheet → Data appears in UI
- Backend logs confirm webhook receipt

## 📁 Repo Structure
