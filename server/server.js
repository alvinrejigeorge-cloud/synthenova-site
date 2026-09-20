const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const ADMIN_DIR = path.join(ROOT_DIR, "admin");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(PUBLIC_DIR, { extensions: ["html"], index: "index.html" }));
app.use("/admin", express.static(ADMIN_DIR, { extensions: ["html"], index: "index.html" }));

app.get("/api/config", (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || "";
    if (!supabaseUrl || !supabasePublishableKey) {
        return res.status(500).json({ success: false, message: "Supabase configuration is missing." });
    }
    res.json({ success: true, supabaseUrl, supabasePublishableKey });
});

app.get("/api/status", (req, res) => res.json({ success: true, message: "SYNTHENOVA backend is running", status: "online" }));
app.get("/api/admin", (req, res) => res.json({ success: true, message: "SYNTHENOVA Admin API is ready" }));
app.get("/health", (req, res) => res.json({ success: true, service: "SYNTHENOVA", status: "healthy", timestamp: new Date().toISOString() }));

app.get("/", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(ADMIN_DIR, "index.html")));
app.get("/admin/", (req, res) => res.sendFile(path.join(ADMIN_DIR, "index.html")));

app.use((req, res) => {
    if (req.path.startsWith("/api/")) return res.status(404).json({ success: false, message: "API endpoint not found" });
    res.status(404).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SYNTHENOVA - 404</title><style>body{margin:0;background:#001f1d;color:#fff;font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center}h1{font-size:120px;margin:0}p{opacity:.55}a{display:inline-block;margin-top:20px;padding:14px 25px;border-radius:30px;background:#fff;color:#001f1d;text-decoration:none;font-weight:bold}</style></head><body><div><h1>404</h1><p>SYNTHENOVA page not found.</p><a href="/">RETURN HOME</a></div></body></html>`);
});

app.use((err, req, res, next) => {
    console.error("SYNTHENOVA server error:", err);
    if (res.headersSent) return next(err);
    res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
    console.log("\n======================================");
    console.log("       SYNTHENOVA BACKEND ONLINE");
    console.log("======================================");
    console.log(`Website : http://localhost:${PORT}`);
    console.log(`Admin   : http://localhost:${PORT}/admin`);
    console.log(`Config  : http://localhost:${PORT}/api/config`);
    console.log(`Status  : http://localhost:${PORT}/api/status`);
    console.log(`Health  : http://localhost:${PORT}/health`);
    console.log("======================================\n");
});
