require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(cors());

// Bazaga ulanish sozlamalari
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'crm_db',
    password: process.env.DB_PASSWORD || 'adminpassword',
    port: parseInt(process.env.DB_PORT || '5432'),
});

// Bazaga ulanishni tekshirish
pool.connect((err, client, release) => {
    if (err) {
        console.error('Bazaga ulanishda xatolik:', err.stack);
    } else {
        console.log('Bazaga muvaffaqiyatli ulanindi!');
        release();
    }
});

// Helper: Audit log yozish
async function writeAuditLog(userId, action) {
    try {
        if (!userId) return;
        await pool.query(
            'INSERT INTO audit_logs (user_id, action) VALUES ($1, $2)',
            [userId, action]
        );
    } catch (err) {
        console.error('Audit log yozishda xato:', err.message);
    }
}

// ----------------------------------------------------
// 1. API: LOGIN
// ----------------------------------------------------
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const result = await pool.query(
            'SELECT id, username, full_name, role, department FROM users WHERE username = $1 AND password = $2 AND is_active = TRUE',
            [username, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            await writeAuditLog(user.id, 'Tizimga muvaffaqiyatli kirdi');
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: 'Login yoki parol noto\'g\'ri!' });
        }
    } catch (err) {
        console.error("SQL Xatolik:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ----------------------------------------------------
// 2. API: DASHBOARD (Analitika)
// ----------------------------------------------------
app.get('/api/dashboard', async (req, res) => {
    try {
        // Jami leadlar
        const totalRes = await pool.query('SELECT COUNT(*) FROM clients');
        const total = parseInt(totalRes.rows[0].count || '0');

        // Jarayondagilar
        const activeRes = await pool.query("SELECT COUNT(*) FROM clients WHERE status IN ('Yangi', 'Jarayonda')");
        const active = parseInt(activeRes.rows[0].count || '0');

        // Muvaffaqiyatli bitimlar
        const successRes = await pool.query("SELECT COUNT(*) FROM clients WHERE status = 'Muvaffaqiyatli'");
        const success = parseInt(successRes.rows[0].count || '0');

        // Umumiy tushum (Kirim)
        const revenueRes = await pool.query("SELECT SUM(amount) FROM finance_logs WHERE type = 'Kirim'");
        const revenue = parseFloat(revenueRes.rows[0].sum || '0');

        res.json({
            success: true,
            total,
            active,
            success,
            revenue
        });
    } catch (err) {
        console.error("Dashboard SQL Xatolik:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Hozirgi login GET so'rovi (eski dashboard fetch mosligi uchun)
app.get('/api/login', async (req, res) => {
    try {
        const totalRes = await pool.query('SELECT COUNT(*) FROM clients');
        const activeRes = await pool.query("SELECT COUNT(*) FROM clients WHERE status IN ('Yangi', 'Jarayonda')");
        const successRes = await pool.query("SELECT COUNT(*) FROM clients WHERE status = 'Muvaffaqiyatli'");
        const revenueRes = await pool.query("SELECT SUM(amount) FROM finance_logs WHERE type = 'Kirim'");
        
        res.json({
            total: parseInt(totalRes.rows[0].count || '0'),
            active: parseInt(activeRes.rows[0].count || '0'),
            success: parseInt(successRes.rows[0].count || '0'),
            revenue: parseFloat(revenueRes.rows[0].sum || '0')
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ----------------------------------------------------
// 2a. API: LEADERBOARD (Xodimlar reytingi)
// ----------------------------------------------------
app.get('/api/leaderboard', async (req, res) => {
    try {
        const queryText = `
            SELECT u.id, u.full_name, u.department, u.username,
                   (SELECT COUNT(*) FROM clients c WHERE c.assigned_to = u.id) as client_count,
                   (SELECT COUNT(*) FROM clients c WHERE c.assigned_to = u.id AND c.status = 'Muvaffaqiyatli') as success_count,
                   COALESCE((SELECT SUM(f.amount) FROM finance_logs f JOIN clients c ON f.client_id = c.id WHERE c.assigned_to = u.id AND f.type = 'Kirim'), 0) as revenue
            FROM users u
            WHERE u.role = 'employee' AND u.is_active = TRUE
            ORDER BY revenue DESC, success_count DESC, client_count DESC
            LIMIT 10
        `;
        const result = await pool.query(queryText);
        res.json(result.rows);
    } catch (err) {
        console.error("Leaderboard SQL Xatolik:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ----------------------------------------------------
// 3. API: EMPLOYEES (HRM)
// ----------------------------------------------------
app.get('/api/employees', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, full_name, role, department, is_active FROM users ORDER BY id DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Xodimlarni olishda xato:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/employees', async (req, res) => {
    const { username, password, full_name, role, department } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (username, password, full_name, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, full_name, role, department',
            [username, password, full_name, role || 'employee', department || '']
        );
        res.json({ success: true, employee: result.rows[0] });
    } catch (err) {
        console.error("Xodim qo'shishda xato:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ----------------------------------------------------
// 4. API: COMPANIES
// ----------------------------------------------------
app.get('/api/companies', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT c.id, c.company_name, COUNT(cl.id) as client_count FROM companies c LEFT JOIN clients cl ON c.id = cl.company_id GROUP BY c.id ORDER BY c.id DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Kompaniyalarni olishda xato:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/companies', async (req, res) => {
    const { company_name } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO companies (company_name) VALUES ($1) RETURNING *',
            [company_name]
        );
        res.json({ success: true, company: result.rows[0] });
    } catch (err) {
        console.error("Kompaniya qo'shishda xato:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ----------------------------------------------------
// 5. API: GLOBAL LEADS
// ----------------------------------------------------
app.get('/api/global-leads', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.id, c.name, c.phone, c.assigned_to, c.status, 
                    co.company_name, 
                    COALESCE((SELECT SUM(amount) FROM finance_logs f WHERE f.client_id = c.id AND f.type = 'Kirim'), 0) as budget 
             FROM clients c 
             LEFT JOIN companies co ON c.company_id = co.id 
             ORDER BY c.id DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Global leadlarni olishda xato:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/global-leads/assign', async (req, res) => {
    const { client_id, user_id } = req.body;
    try {
        const result = await pool.query(
            'UPDATE clients SET assigned_to = $1 WHERE id = $2 RETURNING *',
            [user_id, client_id]
        );

        if (result.rows.length > 0) {
            const lead = result.rows[0];
            const empRes = await pool.query('SELECT full_name FROM users WHERE id = $1', [user_id]);
            const empName = empRes.rows.length > 0 ? empRes.rows[0].full_name : 'Noma\'lum';
            await writeAuditLog(1, `Lead (#ID: ${client_id}, ${lead.name}) xodim (${empName}) ga biriktirildi.`);
            res.json({ success: true, lead: result.rows[0] });
        } else {
            res.status(404).json({ success: false, message: 'Lead topilmadi' });
        }
    } catch (err) {
        console.error("Lead biriktirishda xato:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Yangi lead yaratish (foydali funksiya)
app.post('/api/global-leads', async (req, res) => {
    const { name, phone, company_id, assigned_to, status, budget } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO clients (name, phone, company_id, assigned_to, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, phone, company_id || null, assigned_to || null, status || 'Yangi']
        );
        const newClient = result.rows[0];

        if (budget && parseFloat(budget) > 0) {
            await pool.query(
                'INSERT INTO finance_logs (client_id, amount, type) VALUES ($1, $2, $3)',
                [newClient.id, parseFloat(budget), 'Kirim']
            );
        }

        await writeAuditLog(1, `Yangi Lead qo'shildi: ${name}`);
        res.json({ success: true, client: newClient });
    } catch (err) {
        console.error("Lead qo'shishda xato:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/global-leads/status', async (req, res) => {
    const { client_id, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE clients SET status = $1 WHERE id = $2 RETURNING *',
            [status, client_id]
        );

        if (result.rows.length > 0) {
            const client = result.rows[0];
            await writeAuditLog(1, `Lead (#ID: ${client_id}, ${client.name}) holati "${status}" ga o'zgartirildi.`);
            res.json({ success: true, client });
        } else {
            res.status(404).json({ success: false, message: 'Lead topilmadi' });
        }
    } catch (err) {
        console.error("Lead statusini o'zgartirishda xato:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ----------------------------------------------------
// 6. API: MY CLIENTS (Xodim uchun)
// ----------------------------------------------------
app.get('/api/my-clients/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT c.id, c.name, c.phone, c.status, 
                    COALESCE((SELECT SUM(amount) FROM finance_logs f WHERE f.client_id = c.id AND f.type = 'Kirim'), 0) as budget 
             FROM clients c 
             WHERE c.assigned_to = $1 AND c.status NOT IN ('Muvaffaqiyatli', 'Rad etildi', 'Yopildi')
             ORDER BY c.id DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Xodim mijozlarini olishda xato:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/call-history', async (req, res) => {
    const { client_id, user_id, note, status } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO call_history (client_id, user_id, note) VALUES ($1, $2, $3) RETURNING *',
            [client_id, user_id, note]
        );
        
        if (status) {
            await pool.query('UPDATE clients SET status = $1 WHERE id = $2', [status, client_id]);
        }
        
        const clientRes = await pool.query('SELECT name FROM clients WHERE id = $1', [client_id]);
        const clientName = clientRes.rows.length > 0 ? clientRes.rows[0].name : 'Noma\'lum';
        await writeAuditLog(user_id, `Mijoz (${clientName}) bilan muzokara qayd etildi (Status: ${status || 'O\'zgarishsiz'}): "${note.substring(0, 50)}..."`);
        
        res.json({ success: true, log: result.rows[0] });
    } catch (err) {
        console.error("Muzokara yozishda xato:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ----------------------------------------------------
// 7. API: FINANCE
// ----------------------------------------------------
app.get('/api/finance', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT f.id, f.amount, f.type, c.name as client_name, c.id as client_id 
             FROM finance_logs f 
             LEFT JOIN clients c ON f.client_id = c.id 
             ORDER BY f.id DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Moliya ro'yxatini olishda xato:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/finance', async (req, res) => {
    const { client_id, amount, type } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO finance_logs (client_id, amount, type) VALUES ($1, $2, $3) RETURNING *',
            [client_id || null, amount, type]
        );
        await writeAuditLog(1, `Yangi moliya amali kiritildi: ${type} - $${amount}`);
        res.json({ success: true, finance: result.rows[0] });
    } catch (err) {
        console.error("Moliya amalini qo'shishda xato:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ----------------------------------------------------
// 8. API: AUDIT LOGS
// ----------------------------------------------------
app.get('/api/audit-logs', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT a.id, a.action, a.created_at, u.full_name as user_name 
             FROM audit_logs a 
             LEFT JOIN users u ON a.user_id = u.id 
             ORDER BY a.id DESC 
             LIMIT 100`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Audit loglarini olishda xato:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ----------------------------------------------------
// 9. API: EMPLOYEE PERSONAL DASHBOARD & CALLS
// ----------------------------------------------------
app.get('/api/employee/dashboard/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Jami mijozlarim
        const totalRes = await pool.query('SELECT COUNT(*) FROM clients WHERE assigned_to = $1', [userId]);
        const total = parseInt(totalRes.rows[0].count || '0');

        // Jarayondagilar
        const activeRes = await pool.query("SELECT COUNT(*) FROM clients WHERE assigned_to = $1 AND status IN ('Yangi', 'Jarayonda')", [userId]);
        const active = parseInt(activeRes.rows[0].count || '0');

        // Muvaffaqiyatli bitimlar
        const successRes = await pool.query("SELECT COUNT(*) FROM clients WHERE assigned_to = $1 AND status = 'Muvaffaqiyatli'", [userId]);
        const success = parseInt(successRes.rows[0].count || '0');

        // Shaxsiy tushum
        const revenueRes = await pool.query(
            "SELECT SUM(f.amount) FROM finance_logs f JOIN clients c ON f.client_id = c.id WHERE c.assigned_to = $1 AND f.type = 'Kirim'",
            [userId]
        );
        const revenue = parseFloat(revenueRes.rows[0].sum || '0');

        res.json({
            success: true,
            total,
            active,
            success,
            revenue
        });
    } catch (err) {
        console.error("Employee Dashboard SQL Xatolik:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/call-history/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT ch.id, ch.note, ch.created_at, c.name as client_name 
             FROM call_history ch 
             JOIN clients c ON ch.client_id = c.id 
             WHERE ch.user_id = $1 
             ORDER BY ch.id DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Employee call history SQL Xatolik:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ----------------------------------------------------
// SERVERNI ISHGA TUSHIRISH
// ----------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} manzilida ishga tushdi.`);
});