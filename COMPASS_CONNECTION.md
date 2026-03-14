# Connect MongoDB Compass to the app's database

The app's data (books, users) is stored in the **Docker** MongoDB. To avoid conflicts with a **local MongoDB** on port 27017 (the one that has "Log" and no "library"), the app's MongoDB is exposed on host port **27018**.

## Connect Compass to the app's data

1. **Start the app** (in the project folder):
   ```bash
   docker compose up -d
   ```
2. Open **MongoDB Compass**.
3. **New connection** — paste this and click **Connect**:
   ```text
   mongodb://127.0.0.1:27018
   ```
4. In the left sidebar you should see: **admin**, **config**, **library**, **local** (no "Log").
5. Click **library** → open **books** (244 docs) and **users** (3 docs).

**Why 27018?** If you have MongoDB installed locally, it uses port 27017. The app's MongoDB runs in Docker and is mapped to **27018** on your machine so both can run and you can connect Compass to **127.0.0.1:27018** to see the **library** database.

## Quick check from terminal

```bash
docker compose exec database mongosh library --quiet --eval "print('books:', db.books.countDocuments()); print('users:', db.users.countDocuments());"
```

You should see: `books: 244` and `users: 3`.
