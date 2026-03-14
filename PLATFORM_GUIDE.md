# Library Management Platform — User & Admin Guide

Quick guide for **new users** and **admins** on how to use the platform.

---

## For New Users (Borrowers)

### 1. Register
- Go to **Register** and enter: **Name**, **Email**, **Password** (min 6 characters), and optionally **Mobile**.
- After registering you are logged in and taken to the Books page.

### 2. Login
- Use your **Email** and **Password** on the **Login** page.

### 3. Browse books
- **Books** — Browse all books. Use **search**, **category filter**, and **sort**. Click a book to open its detail page.

### 4. Request to borrow a book
- On a book’s detail page, if it’s **in stock**, click **“Request to borrow”**.
- Your request is **pending** until an admin approves it at the library.
- **Important:** Go to the library with your **email or mobile**. The admin will see your request (and any reservation), approve it, and hand you the book. Only after admin approval is the book considered borrowed and the due date set.

### 5. Reserve a book (from home)
- If a book is **out of stock**, you can click **“Reserve (show at library to collect)”**.
- Your reservation is saved under **My Reservations**.
- When you go to the library, tell the admin your **email or mobile**. They will see that you **reserved from home** and can approve the borrow when they give you the book.

### 6. My Books
- **My Books** shows:
  - **Pending approval** — You requested; admin has not approved yet.
  - **Borrowed** — Admin approved; you have the book. You’ll see the **due date**.
  - **Returned (pending verification)** — You clicked “I returned this book”; admin has not verified yet.
- **Due alerts** (same page):
  - **Due soon** — Due today or tomorrow.
  - **Overdue** — Past due date; a fine may apply when you return.

### 7. Return a book
- When you’ve brought the book back, open **My Books** and click **“I returned this book”** for that copy.
- Status becomes **“Returned (pending verification)”**. The admin will verify at the library and then inventory is updated. If you returned late, a fine may be applied at verification.

### 8. My Reservations
- Lists books you’ve **reserved**. You can **cancel** a reservation or go to the library and show your email/mobile so the admin can approve the borrow.

---

## For Admins

### 1. Login
- Use admin credentials (e.g. **admin@library.com** / **admin123** or **superadmin@library.com** / **super123**).  
- After login, you’ll see **Admin portal** in the header.

### 2. Dashboard
- **Admin → Dashboard** shows:
  - Total books, users, borrows, active borrows.
  - **Pending approval** — Borrow requests waiting for your approval.
  - **Pending verify** — Returns submitted by users, waiting for you to verify.
- Use **“Approve borrows”** and **“Verify returns”** (or the sidebar) to handle these.

### 3. Approve borrow requests
- **Admin → Approve borrows**
- Each row is a user who **requested** to borrow a book. You see:
  - Book title, user **name**, **email**, **mobile**.
  - **“Reserved from home”** if they reserved it from the app.
- When you **hand over the book** at the library, click **Approve**.
- The borrow is then **active**, inventory is reduced, and a **due date** is set (from the book’s loan period, e.g. 10 days).
- **Rule:** A user can have at most **2 copies of the same book** at once. If you need to allow more, **Super Admin** can check **“Override 2-copy limit”** and then approve.

### 4. Verify returns
- **Admin → Verify returns**
- Each row is a user who said **“I returned this book”**. You see user details and the book.
- When you’ve **received and checked** the book, click **Verify return**.
- Inventory is increased. If the return is **late** (after due date), a **fine** is applied automatically (e.g. per day overdue).

### 5. Manage books
- **Admin → Manage Books**
- **Search** and **filter by category** to find books.
- **Add book:** Fill title, author, category, genre, copies, **loan period (days)** (e.g. 10, 30, 365), thumbnail URL; click Add.
- **Edit:** Change details, including **available copies** and **loan period (days)**.
- **Delete:** Remove a book from the catalog.

### 6. Out of stock
- **Admin → Out of stock**
- Lists books with **0 available copies**. Use **search** and **category** to narrow the list.

### 7. Users (Super Admin only)
- **Admin → Users**
- **Search** users by name, email, or mobile.
- Table shows **name**, **email**, **mobile**, **role**, **borrowed count**, **reservations count**.
- **Create user:** Add new user or admin (name, email, password, role, optional mobile). For **user** role, Super Admin can check **“Allow more than 2 copies of same book”** for special permission.

---

## Quick reference

| Role   | Main actions |
|--------|----------------|
| **User** | Register/Login → Books → Request to borrow or Reserve → My Books (see due date, return) → My Reservations |
| **Admin** | Login → Dashboard → Approve borrows / Verify returns → Manage Books / Out of stock → (Super Admin) Users |

---

## Default login (if seeded)

- **Super Admin:** superadmin@library.com / super123  
- **Admin:** admin@library.com / admin123  

Change these in production.
