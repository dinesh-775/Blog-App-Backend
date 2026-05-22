import exp from 'express'
import mongoose, { connect } from 'mongoose'
import { config } from 'dotenv'
import cookieParser from 'cookie-parser'
import { userRoute } from './APIs/UserAPI.js'
import { authorRoute } from './APIs/AuthorAPI.js'
import { adminRoute } from './APIs/AdminAPI.js'
import { commonRouter } from './APIs/CommonAPI.js'
import cors from 'cors'

config()

const app = exp()

// ── CORS ──────────────────────────────────────────────────────────────────────
// Must be the FIRST middleware, BEFORE routes.
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://capstone-frontend-olive.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}

app.use(cors(corsOptions))

// Explicitly answer all pre-flight OPTIONS requests BEFORE any route handler.
// (Using manual middleware to avoid Express 5 path-to-regexp `*` errors)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
})

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(exp.json())
app.use(cookieParser())

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({ message: "Capstone API is running", database: mongoose.connection.readyState === 1 ? "connected" : "connecting/disconnected" })
})

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/user-api', userRoute)
app.use('/author-api', authorRoute)
app.use('/admin-api', adminRoute)
app.use('/common-api', commonRouter)

// ── DB + Server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

const connectDB = async () => {
  try {
    console.log("Attempting to connect to DB...");
    await connect(process.env.DB_URL)
    console.log("DB connected successfully")
  } catch (err) {
    console.error("DB connection failed:", err.message)
    // Don't exit process, let the server stay up for debugging
  }
}

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  console.log("Invalid path:", req.url)
  res.status(404).json({ message: req.url + " is an invalid path" })
})

// ── Error handling middleware ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.log("Error name:", err.name)
  console.log("Error code:", err.code)
  console.log("Full error:", err)

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "error occurred", error: err.message })
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "error occurred", error: err.message })
  }

  const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code
  const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue

  if (errCode === 11000) {
    const field = Object.keys(keyValue)[0]
    const value = keyValue[field]
    return res.status(409).json({ message: "error occurred", error: `${field} "${value}" already exists` })
  }

  if (err.status) {
    return res.status(err.status).json({ message: "error occurred", error: err.message })
  }

  // Include error message for debugging
  res.status(500).json({
    message: "error occurred",
    error: err.message || "Server side error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  })
})
