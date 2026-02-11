const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'microinsurance.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

db.serialize(() => {
    // Users table (optional, mainly for off-chain metadata)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        address TEXT PRIMARY KEY,
        email TEXT
    )`);

    // Claims table (for history)
    db.run(`CREATE TABLE IF NOT EXISTS claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claimId INTEGER,
        claimant TEXT,
        deviceType TEXT,
        description TEXT,
        estimatedCost INTEGER,
        status TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

module.exports = db;
