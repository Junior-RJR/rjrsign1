-- RJR Sync - Schema Setup Script for Supabase / PostgreSQL
-- Paste this script into your Supabase SQL Editor to create the tables.

-- 1. registered_clients Table (Clients database with hashed passwords)
CREATE TABLE IF NOT EXISTS public.registered_clients (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    representatives JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of representatives {name, email, role}
    current_password VARCHAR(512) NOT NULL DEFAULT '123456', -- This will store SHA512 PBKDF2 hash of standard initial pass
    has_changed_password BOOLEAN NOT NULL DEFAULT FALSE,
    monthly_fee DECIMAL(12, 2) NOT NULL DEFAULT 179.90, -- Plan price
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. contracts Table (Digital Contracts with multi-party signs + auditing details)
CREATE TABLE IF NOT EXISTS public.contracts (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- MarkDown markdown contract format
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending' or 'signed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_drawing TEXT, -- Master signature PNG image in Base64
    signature_name VARCHAR(255),
    signature_ip VARCHAR(100), -- Public IP trace of validation
    sent_email_count INTEGER NOT NULL DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL DEFAULT 'Outro',
    value DECIMAL(12, 2),
    signers JSONB NOT NULL DEFAULT '[]'::jsonb -- Track status of {name, email, status ('pending'/'signed'), signed_at, signature_drawing, signature_ip, signature_type ('drawn'/'typed')}
);

-- 3. billing_items Table (Sub-fiat billing ledger with PIX dynamic details)
CREATE TABLE IF NOT EXISTS public.billing_items (
    id VARCHAR(255) PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'monthly_fee', -- 'monthly_fee' or 'additional'
    amount DECIMAL(12, 2) NOT NULL DEFAULT 179.90, -- R$ 179.90 default
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending' or 'paid'
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. leads Table (B2B Leads Captured from the Public Funnel)
CREATE TABLE IF NOT EXISTS public.leads (
    id VARCHAR(255) PRIMARY KEY,
    cnpj VARCHAR(50) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(150) NOT NULL,
    state VARCHAR(50) NOT NULL,
    business_type VARCHAR(100) NOT NULL, -- 'Construtora', 'Distribuidora', 'Lojista de Tintas', 'Pintor de Obras Consumidor', 'Uso Próprio'
    target_product VARCHAR(255) NOT NULL,
    message TEXT,
    is_contacted BOOLEAN NOT NULL DEFAULT FALSE,
    utm_source VARCHAR(150),
    utm_medium VARCHAR(150),
    utm_campaign VARCHAR(150),
    utm_content VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. newsletter Table (Newsletter Emails Tracker)
CREATE TABLE IF NOT EXISTS public.newsletter (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. categories Table (Product Categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- 7. products Table (Bellacor Industrial Catalog)
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    image TEXT NOT NULL, -- Drive convert target
    description TEXT NOT NULL,
    is_essential BOOLEAN NOT NULL DEFAULT FALSE, -- Up to 3 allowed in layout
    dilution VARCHAR(255) NOT NULL,
    diluent VARCHAR(150) NOT NULL,
    finish VARCHAR(150) NOT NULL,
    yield_per_m2 VARCHAR(255) NOT NULL,
    drying_time VARCHAR(255) NOT NULL,
    yield_total VARCHAR(255) NOT NULL,
    recommended_coats INTEGER NOT NULL DEFAULT 2,
    area_of_use VARCHAR(150) NOT NULL,
    odor VARCHAR(150) NOT NULL,
    antimold BOOLEAN NOT NULL DEFAULT TRUE,
    colors JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of colors (e.g. ["Preto #000000", "Branco #ffffff"])
    variants JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of variants [{size, price, image, colorName, colorHex}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Insert Default Category items
INSERT INTO public.categories (id, name) VALUES 
('cat-1', 'Acrílicos Cobertura'),
('cat-2', 'Esmaltes Metais/Madeiras'),
('cat-3', 'Seladores e Primers'),
('cat-4', 'Tintas Premium Impermeabilizantes')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user: devrogeriojunior@gmail.com (Password: Manu2612)
-- Current password value stored is the PBKDF2 SHA512 hex representation of "Manu2612" (using salt 'rjr_sync_bellacor_secure_salt_987')
INSERT INTO public.registered_clients (id, name, email, representatives, current_password, has_changed_password, monthly_fee, created_at) VALUES
('admin-user', 'Rogério Júnior (Admin)', 'devrogeriojunior@gmail.com', '[{"name": "Rogerio Junior", "email": "devrogeriojunior@gmail.com", "role": "Administrador"}]'::jsonb, 'e85cae10b106a77d85c85671ef3b6ea26fe5750d4ad6be0eac6bc4dbd0b985f0ef3524b07173b06de767dc40fe7e8bf69e6b5da418beccd29ec978eb3cc7b43f', TRUE, 0.00, NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert default client user: consultor@bellacortintas.com.br (Password: 123456)
-- Current password value stored is the PBKDF2 SHA512 hex representation of "123456"
INSERT INTO public.registered_clients (id, name, email, representatives, current_password, has_changed_password, monthly_fee, created_at) VALUES
('bellacor-client', 'Bellacor Tintas', 'consultor@bellacortintas.com.br', '[{"name": "Bruno Carvalho", "email": "consultor@bellacortintas.com.br"}]'::jsonb, '12c1d9bfe66cbce4857ed8ac31fa9fc7a72dccd31d044fa66c3038ce02fbf246ca8a892789211c4c920f5c1d3bf52eafdfa610fdf441c08d13af23b53f622be3', FALSE, 179.90, NOW())
ON CONFLICT (email) DO NOTHING;


-- ===========================================================================
-- DATABASE MIGRATION SCRIPT (ALTER STATEMENTS FOR EXISTING LIVE INSTANCES)
-- ===========================================================================
-- Run this block in your Supabase SQL Editor if your tables are already created:
-- 
-- ALTER TABLE public.registered_clients 
-- ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(12, 2) NOT NULL DEFAULT 179.90;
-- ===========================================================================
