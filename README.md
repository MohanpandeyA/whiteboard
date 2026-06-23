# ✏️ Whiteboard App

A full-stack collaborative whiteboard application built with **React**, **Node.js/Express**, and **MongoDB Atlas**.

---

## 🚀 Features

- **Drawing Tools** — Brush (freehand), Line, Rectangle, Circle/Ellipse, Arrow, Text
- **Eraser** — Partial path eraser (erases only the drawn stroke, not the whole element)
- **Color Palette** — Black, White, Red, Blue, Green, Orange, Yellow + custom color picker
- **Stroke & Fill** — Per-tool stroke color, fill color, and size controls
- **Undo / Redo** — Full history with `Ctrl+Z` / `Ctrl+Y` keyboard shortcuts
- **Download** — Export canvas as PNG
- **Auth** — JWT-based register/login/logout
- **Dashboard** — Create, list, and delete canvases
- **Auto-save** — Canvas elements auto-save to MongoDB every 2 seconds
- **Persistent** — Reload the page and your drawing is restored

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, RoughJS, Perfect Freehand, Tailwind CSS |
| Backend | Node.js, Express 5, ESM modules |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (jsonwebtoken), bcrypt |
| HTTP Client | Axios |

---

## 📁 Project Structure

```
whiteboard/
├── backend/
│   ├── controllers/
│   │   ├── canvascontroller.js   # Canvas CRUD
│   │   ├── usercontroller.js     # Auth (register/login/profile)
│   │   └── postcontoller.js      # Posts (unused)
│   ├── middleware/
│   │   └── authmiddleware.js     # JWT verification
│   ├── models/
│   │   ├── canvasmodel.js        # Canvas schema + statics
│   │   ├── usermodel.js          # User schema + statics
│   │   └── postmodels.js         # Post schema
│   ├── routes/
│   │   ├── canvasroutes.js       # /api/canvas CRUD routes
│   │   └── userRoutes.js         # /user auth routes
│   ├── db.js                     # MongoDB connection
│   ├── index.js                  # Express app entry point
│   └── .env                      # Environment variables (not committed)
│
└── frontend/
    ├── public/
    └── src/
        ├── api.js                # Axios API client (auto JWT)
        ├── App.js                # React Router setup
        ├── constants.js          # Tool/color/action constants
        ├── components/
        │   ├── Board/            # Canvas drawing surface
        │   ├── Toolbar/          # Tool selection bar
        │   ├── Toolbox/          # Color/size controls
        │   └── PrivateRoute.js   # Auth guard
        ├── pages/
        │   ├── Login.js          # Login page
        │   ├── Register.js       # Register page
        │   ├── Dashboard.js      # Canvas list/create/delete
        │   └── BoardPage.js      # Whiteboard with auto-save
        ├── store/
        │   ├── AuthContext.js    # Auth state (login/logout)
        │   ├── BoardProvider.js  # Drawing state machine
        │   ├── ToolboxProvider.js# Toolbox state
        │   ├── board-context.js  # Board context definition
        │   └── toolbox-context.js# Toolbox context definition
        └── utils/
            ├── element.js        # Shape creation + hit testing
            └── math.js           # Geometry helpers
```

---

## ⚙️ Setup & Run Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/whiteboard.git
cd whiteboard
```

### 2. Configure backend environment
Create `backend/.env`:
```env
PORT=3030
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your_random_secret_here
FRONTEND_URL=http://localhost:3000
```

### 3. Install & run backend
```bash
cd backend
npm install
npm run dev
# → Server running on http://localhost:3030
```

### 4. Configure frontend environment
Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:3030
```

### 5. Install & run frontend
```bash
cd frontend
npm install
npm start
# → App running on http://localhost:3000
```

---

## 🌐 Deploy to Production

### Backend → [Render.com](https://render.com) (free)
1. New Web Service → connect GitHub repo
2. Root Directory: `backend`
3. Build: `npm install` | Start: `npm start`
4. Add environment variables (MONGO_URI, JWT_SECRET, FRONTEND_URL, PORT)

### Frontend → [Vercel](https://vercel.com) (free)
1. New Project → import GitHub repo
2. Root Directory: `frontend`
3. Add environment variable: `REACT_APP_API_URL=https://your-render-url.onrender.com`

---

## 🔑 API Endpoints

### Auth (`/user`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/user/register` | Register new user |
| POST | `/user/login` | Login, returns JWT |
| GET | `/user/profile` | Get current user (auth required) |

### Canvas (`/api/canvas`) — all require JWT
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/canvas` | Get all canvases for user |
| GET | `/api/canvas/:id` | Get single canvas |
| POST | `/api/canvas` | Create new canvas |
| PUT | `/api/canvas/:id` | Update canvas elements/name |
| DELETE | `/api/canvas/:id` | Delete canvas (owner only) |

---

## 🎨 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |

---

## 📝 Notes

- The eraser tool draws a partial erase path using canvas `destination-out` composite operation — it erases only the pixels you drag over, not entire elements
- Canvas auto-saves to MongoDB 2 seconds after each drawing action
- JWT tokens expire after 1 hour — you'll be redirected to login
- Passwords must be strong (min 8 chars, uppercase, symbol) — enforced by `validator.isStrongPassword`
