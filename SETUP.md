# Pure JavaScript Setup - No TypeScript, No Next.js

This project uses **pure JavaScript** with the following stack:

## Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework for API routes and webhooks
- **MySQL 2** - Database driver
- No TypeScript, no build step required

### Frontend
- **React 18** - UI library
- **Vite** - Lightning-fast build tool for development
- **Axios** - HTTP client for API calls
- Pure JavaScript (.js files), no JSX build complexity

### Database
- **MySQL 5.7+** - Data persistence

### Google Integration
- **Google Apps Script** - Pure JavaScript that runs in Google's environment

## Installation & Running

### 1. Backend Setup

```bash
cd backend
npm install
```

Update `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sheets_sync
PORT=3001
NODE_ENV=development
```

Create MySQL database:
```bash
mysql -u root -p < schema.sql
```

Start server:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend automatically proxies to backend via Vite's proxy config.

## Running Both Simultaneously

Terminal 1 - Backend:
```bash
cd backend && npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend && npm run dev
```

Then:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Google Apps Script Setup

1. Open your Google Sheet
2. Extensions → Apps Script
3. Copy code from `/backend/google-apps-script.js`
4. Paste into Apps Script editor
5. Update `WEBHOOK_URL = 'http://localhost:3001/sheet/webhook'`
6. Run the script once to authorize
7. Start editing your sheet - changes sync instantly!

## Environment Files

### Backend .env
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=sheets_sync
PORT=3001
NODE_ENV=development
```

### Frontend .env (optional, defaults to localhost:3001)
```env
REACT_APP_API_URL=http://localhost:3001
```

## Building for Production

### Backend
```bash
cd backend
npm install --production
# Run with: node server.js
```

### Frontend
```bash
cd frontend
npm run build
# Creates dist/ folder with optimized build
```

Both are ready to deploy to any Node.js hosting (Heroku, Railway, AWS EC2, etc.)

## API Endpoints

All endpoints run on `http://localhost:3001`:

- `POST /sheet/webhook` - Receives Google Sheet edits
- `POST /db/webhook` - Receives database change notifications
- `GET /sync/users` - List all users
- `GET /sync/conflicts` - View sync conflicts
- `GET /sync/changelog` - View webhook audit log
- `GET /sync/status` - System health status

## Debugging

### Backend Logs
```bash
# All operations log to console when running with npm run dev
# Look for [SYNC], [WEBHOOK-SHEET], [WEBHOOK-DB] prefixes
```

### Frontend Console
Press F12 to open browser DevTools → Console tab

### Database Queries
```sql
SELECT * FROM webhook_audit ORDER BY created_at DESC LIMIT 10;
SELECT * FROM sync_conflicts WHERE resolved_at IS NULL;
SELECT * FROM change_log LIMIT 10;
```

