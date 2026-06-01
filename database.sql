-- Eski jadvallarni tozalash (agar mavjud bo'lsa)
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS users;

-- Foydalanuvchilar (Admin va Xodimlar)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'employee',
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kompaniyalar
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL
);

-- Mijozlar (Leads)
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    company_id INT REFERENCES companies(id),
    assigned_to INT REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'Yangi'
);

-- Moliya loglari
CREATE TABLE IF NOT EXISTS finance_logs (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id),
    amount NUMERIC(12,2),
    type VARCHAR(20) -- 'Kirim' yoki 'Chiqim'
);

-- Audit loglari (Xavfsizlik)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Qo'ng'iroqlar tarixi
CREATE TABLE IF NOT EXISTS call_history (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id),
    user_id INT REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Boshlang'ich Admin
INSERT INTO users (username, password, full_name, role) 
VALUES ('admin', 'admin123', 'Asosiy Admin', 'admin')
ON CONFLICT DO NOTHING;