# Google Sheets ↔ MySQL Bi-directional Sync System

A production-ready synchronization system that keeps Google Sheets and MySQL database in real-time sync with conflict resolution, idempotency, and loop prevention.

## 🏗️ Architecture Overview

```
Google Sheets
    ⬇️ (Apps Script Webhook)
Backend Sync Service (Node.js + Express)
    ⬇️ ⬆️
MySQL Database
```

### Core Components

1. **Google Apps Script** - Real-time sheet edit detection via `onEdit` trigger
2. **Express Backend** - Webhook receiver and sync engine
3. **MySQL Database** - Single source of truth with versioning
4. **React Frontend** - Dashboard for monitoring and testing

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- MySQL 5.7+
- Google Account with Sheets access
- npm or yarn

### Backend Setup (Node.js + Express)

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sheets_sync
PORT=3001
NODE_ENV=development
```

Initialize the database:

```bash
mysql -u root -p < schema.sql
```

Start the backend:

```bash
npm run dev
```

Backend runs on `http://localhost:3001`

### Frontend Setup (React + Vite)

```bash
cd frontend
npm install
```

Start the frontend development server:

```bash
npm run dev
```

Frontend runs on `http://localhost:3000` and automatically proxies API calls to `http://localhost:3001`

### Google Sheets Setup

1. Open your Google Sheet
2. Click **Extensions → Apps Script**
3. Copy the code from `/backend/google-apps-script.js`
4. Replace `WEBHOOK_URL` with your backend URL
5. Update `SHEET_NAME` to match your sheet name
6. Click **Run** and authorize the script
7. Now edits trigger real-time sync!

## 🔄 Sync Flow

### Sheet → Database

```
1. User edits cell in Google Sheet
2. onEdit trigger fires
3. Apps Script calls /sheet/webhook
4. Backend receives event
5. Sync engine processes change:
   - Check idempotency (version)
   - Detect conflicts
   - Resolve if needed
   - Update database
6. Change logged with metadata
7. Frontend polls and displays update
```

### Database ��� Sheet

```
1. Application updates database directly
2. Call POST /db/webhook with changes
3. Backend sync engine processes
4. Can trigger sheet update (manual or via Apps Script)
```

## 🛡️ Anti-Loop Prevention

### Mechanism

The system prevents infinite sync loops using:

1. **Source Tracking** - Every record stores its last modification source
2. **Loopback Detection** - Ignores updates from the same source
3. **Version Numbers** - Incremented on each change

### Implementation

```javascript
// In syncEngine.js
const shouldIgnoreLoopback = (currentRecord, source) => {
  return currentRecord.source === source && currentRecord.source !== 'MANUAL';
};
```

## 📌 Idempotency

All operations are **idempotent** - executing the same sync event multiple times produces the same result.

### Achieved Through

1. **Version-based updates** - Each row has a version number
2. **Timestamp validation** - Stale updates are ignored
3. **Change log tracking** - Prevents duplicate processing

```javascript
// Idempotency check
if (isStaleUpdate(currentRecord, event)) {
  return { status: 'ignored', reason: 'stale_version' };
}
```

## ⚔️ Conflict Resolution

When Sheet and DB are modified simultaneously, conflicts are resolved using **Last-Write-Wins** strategy:

```javascript
// Conflict resolution logic
if (new Date(event.timestamp) > new Date(currentRecord.updated_at)) {
  // Incoming change is newer - apply it
  resolvedChanges[field] = conflict.incomingValue;
} else {
  // Current value is newer - keep it
  resolvedChanges[field] = conflict.currentValue;
}
```

All conflicts are logged in the `sync_conflicts` table for audit trail.

## 🗄️ Database Schema

### users table

```sql
id              INT PRIMARY KEY
name            VARCHAR(255)
email           VARCHAR(255) UNIQUE
salary          DECIMAL(10, 2)
updated_at      TIMESTAMP (auto-updated)
updated_by      VARCHAR(50)
source          VARCHAR(50) -- 'SHEET' or 'DB'
version         INT         -- incremented on updates
```

### change_log table

Tracks all modifications for audit trail and change detection

### webhook_audit table

Logs all incoming webhooks for debugging

### sync_conflicts table

Records unresolved conflicts with resolution strategy used

## 🧪 Testing

### Test Sheet → Database Sync

1. Frontend: Click "Data" tab
2. Edit a cell in your Google Sheet
3. Watch the database update in real-time
4. Check the "Webhook Log" tab to see the event

### Test Database → Sheet

1. Frontend: Click "Data" tab, then "Edit" button
2. Modify a value and click "Save"
3. This sends a webhook to backend
4. Value is updated in database
5. Can manually update Google Sheet

### Conflict Simulation

1. Have two users edit the same cell simultaneously
2. Check "Conflicts" tab to see resolution
3. Verify that last-write-wins strategy is applied

## 📊 API Endpoints

### Webhook Endpoints

```
POST /sheet/webhook
  - Receives edits from Google Sheets
  - Payload: { row, column, oldValue, newValue, sheetName }

POST /db/webhook
  - Receives DB changes
  - Payload: { tableId, rowId, operation, changes }
```

### Data Endpoints

```
GET /sync/users
  - Fetch all users with sync metadata

GET /sync/conflicts
  - Get all recorded conflicts

GET /sync/changelog
  - Get webhook audit log

GET /sync/status
  - Get system health status
```

## 🔍 Monitoring

### Dashboard Features

- **Data Tab** - View all users and edit from UI
- **Conflicts Tab** - Monitor unresolved conflicts
- **Webhook Log** - Inspect all incoming webhooks
- **Status Tab** - System health and integration instructions

## 🚨 Edge Cases Handled

### Google Sheets

- ✅ Multiple users editing same cell
- ✅ Row deletion
- ✅ Column reorder (via column mapping)
- ✅ Sheet renamed
- ✅ API rate limits (exponential backoff ready)

### Database

- ✅ Partial failures
- ✅ Transaction rollback
- ✅ Duplicate updates (idempotency)
- ✅ Schema changes (via versioning)

### Network

- ✅ Webhook retry logic
- ✅ Offline handling (polling on frontend)
- ✅ Stale data detection
- ✅ Event ordering via timestamps

## 🔐 Security

### Implemented

- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS enabled for frontend
- ✅ Error messages don't leak internal details
- ✅ Audit trail of all changes

### To Add for Production

- 🔒 API key authentication
- 🔒 OAuth 2.0 for Google APIs
- 🔒 Rate limiting per user
- 🔒 Encrypted database connection
- 🔒 HTTPS/TLS for all webhooks

## 📈 Scalability

### Current Setup

Handles moderate traffic with MySQL + Node.js.

### For Scale (Future)

- Add Redis queue for webhook buffering
- Implement database sharding
- Use message broker (RabbitMQ/Kafka)
- Implement row-level locks
- Add dead-letter queue for failed syncs

## 🔧 Configuration

### Column Mapping (in sheetWebhook.js)

Adjust column numbers to match your sheet:

```javascript
const columnMap = {
  1: 'id',       // Column A
  2: 'name',     // Column B
  3: 'email',    // Column C
  4: 'salary',   // Column D
};
```

### Conflict Strategy

Default is `LAST_WRITE_WINS`. To change strategy, edit `syncEngine.js`:

```javascript
const strategy = CONFLICT_STRATEGIES.VERSION_BASED; // or MANUAL
```

## 🐛 Debugging

### Enable Logging

All major operations log to console:

```
[SYNC] Processing SHEET event
[WEBHOOK-SHEET] Received event
[SYNC] Conflict detected for row 5
[SYNC] Applied update to users row 5
```

### Check Database

```sql
SELECT * FROM webhook_audit ORDER BY created_at DESC LIMIT 10;
SELECT * FROM sync_conflicts WHERE resolved_at IS NULL;
SELECT * FROM change_log WHERE processed = FALSE;
```

## 📝 Environment Variables

### Backend (.env)

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=sheets_sync
PORT=3001
NODE_ENV=development
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:3001
```

## 🤝 Contributing

Extend the system by:

1. Adding more tables - duplicate pattern in routes
2. Custom conflict resolution - modify `resolveConflict()`
3. Authentication - add to middleware
4. More integrations - add new webhook routes

## 📞 Support

For issues:

1. Check webhook logs in frontend dashboard
2. Review database change_log table
3. Inspect browser console for errors
4. Check backend logs for sync engine issues

## 📄 License

MIT

---

**Built for production-grade data synchronization** ✨
