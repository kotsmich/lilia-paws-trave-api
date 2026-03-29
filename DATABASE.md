# Database Viewer Options

The API uses a SQLite database file at `lilia-paws-api/database.sqlite`.

---

## 1. TablePlus (Recommended GUI)

Download from https://tableplus.com (free tier available)

**Connection settings:**
- Type: SQLite
- Path: `/path/to/lilia-paws-api/database.sqlite`

Full GUI — browse tables, run SQL queries, edit records directly.

---

## 2. Swagger UI

Start the API (`npm run start:dev`), then open:

```
http://localhost:3000/api/docs
```

Test all endpoints directly in the browser. Use the **Authorize** button (top right) with your JWT token to access protected routes.

---

## 3. AdminJS Panel

> Requires installing the AdminJS packages separately (not yet installed).

```bash
npm install @adminjs/nestjs @adminjs/typeorm adminjs
```

Once configured, the DB admin UI is available at:

```
http://localhost:3000/admin-db
```

View, create, edit, and delete any record directly in the browser.

---

## 4. SQLite CLI

Requires `sqlite3` installed on your system.

```bash
sqlite3 database.sqlite
```

Useful commands:

```sql
.tables                  -- list all tables
.schema trips            -- show table schema
SELECT * FROM trips;     -- query all trips
SELECT * FROM trip_request;
SELECT * FROM dog;
SELECT * FROM contact_submission;
.quit                    -- exit
```

---

## 5. VS Code Extension

Install **SQLite Viewer** by Florian Klampfer from the VS Code marketplace.

Once installed, click `database.sqlite` directly in the Explorer panel — it opens as a visual table viewer. No configuration needed.
