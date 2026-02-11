require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/database');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// --- Endpoints ---

// 1. User Dashboard: Get claim history
app.get('/user/:address/claims', (req, res) => {
    const { address } = req.params;
    db.all("SELECT * FROM claims WHERE claimant = ?", [address], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ claims: rows });
    });
});

// 2. Submit Claim Metadata (called by frontend before/after on-chain tx)
app.post('/claims', (req, res) => {
    const { claimId, claimant, deviceType, description, estimatedCost } = req.body;
    const stmt = db.prepare("INSERT INTO claims (claimId, claimant, deviceType, description, estimatedCost, status) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run(claimId, claimant, deviceType, description, estimatedCost, 'Pending');
    stmt.finalize();
    res.json({ message: "Claim metadata saved" });
});

// 3. Admin Dashboard: Get all pending claims
app.get('/admin/claims', (req, res) => {
    db.all("SELECT * FROM claims WHERE status = 'Pending'", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ claims: rows });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Backend API running on port ${PORT}`);
});
