# 🗄️ Guia de Configuração do Banco de Dados - RJR Sign (Supabase)

Este documento contém o tutorial passo a passo e o script SQL para provisionar a estrutura de tabelas relacionais do sistema **RJR Sign** no **Supabase** (PostgreSQL).

---

## 🚀 Como Integrar e Criar o Banco no Supabase

Siga as etapas abaixo para ter seu banco pronto e funcional para homologação e produção:

1. Acesse o painel do [Supabase](https://supabase.com/) e crie um novo projeto (ex: `RJR Sign`).
2. No menu lateral esquerdo, clique em **SQL Editor** (ícone `>_` ou folha de código).
3. Clique em **"New Query"** (Nova consulta em branco).
4. Copie todo o código contido no Bloco SQL abaixo.
5. Cole no editor do Supabase e clique em **"Run"** (ou aperte `Ctrl + Enter`).
6. Pronto! As tabelas estarão criadas e populadas com as contas de demonstração provisórias prontas para login.

---

## 📝 Script SQL de Criação de Tabelas (PostgreSQL / Supabase)

Copie e execute o trecho de código abaixo no editor SQL do Supabase:

```sql
-- RJR Sign - Schema Setup Script for Supabase / PostgreSQL
-- Copie e cole este script no painel SQL Editor do seu projeto Supabase.

-- =========================================================================
-- 1. TABELA: registered_clients (Clientes Habilitados a Logar no Sistema)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.registered_clients (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    representatives JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de Representantes [{name, email, role}]
    current_password VARCHAR(512) NOT NULL DEFAULT '123456', -- Hash SHA512 PBKDF2 correspondente
    has_changed_password BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =========================================================================
-- 2. TABELA: contracts (Contratos Digitais & Logs de Conformidade)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.contracts (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- Conteúdo do instrumento no formato Markdown
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending' (pendente) ou 'signed' (assinado)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_drawing TEXT, -- Imagem de assinatura digitalizada/desenhada em Base64 PNG
    signature_name VARCHAR(255),
    signature_ip VARCHAR(105), -- IP Auditado do firmante
    sent_email_count INTEGER NOT NULL DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL DEFAULT 'Prestação de Serviços',
    value DECIMAL(12, 2) DEFAULT 179.90,
    signers JSONB NOT NULL DEFAULT '[]'::jsonb -- Histórico dos signatários da lousa [{name, email, status, signed_at}]
);

-- =========================================================================
-- 3. TABELA: billing_items (Controle Financeiro / Grade de Mensalidades)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.billing_items (
    id VARCHAR(255) PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'monthly_fee', -- 'monthly_fee' ou 'additional'
    amount DECIMAL(12, 2) NOT NULL DEFAULT 179.90,
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending' ou 'paid' (liquidado)
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =========================================================================
-- 4. TABELA: leads (Formulários do CRM Antigo / Opcional)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id VARCHAR(255) PRIMARY KEY,
    cnpj VARCHAR(50) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(150) NOT NULL,
    state VARCHAR(50) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    target_product VARCHAR(255) NOT NULL,
    message TEXT,
    is_contacted BOOLEAN NOT NULL DEFAULT FALSE,
    utm_source VARCHAR(150),
    utm_medium VARCHAR(150),
    utm_campaign VARCHAR(150),
    utm_content VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =========================================================================
-- 5. TABELA: newsletter (Subscrições de Comunicação / Opcional)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.newsletter (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


-- =========================================================================
-- 🔥 INSERÇÃO DE USUÁRIOS PADRÃO (SEMENTES DO BANCO)
-- =========================================================================

-- A) ADMINISTRADOR TÉCNICO MASTER (Rogério Júnior)
-- Email: devrogeriojunior@gmail.com
-- Senha Provisória Cadastrada: Manu2612
-- O hash abaixo é gerado via algoritmo PBKDF2 SHA-512 usando o sal 'rjr_sync_bellacor_secure_salt_987'
INSERT INTO public.registered_clients (
    id, name, email, representatives, current_password, has_changed_password, created_at
) VALUES (
    'admin-user', 
    'Rogério Júnior (Admin)', 
    'devrogeriojunior@gmail.com', 
    '[{"name": "Rogerio Junior", "email": "devrogeriojunior@gmail.com", "role": "Administrador"}]'::jsonb, 
    'e85cae10b106a77d85c85671ef3b6ea26fe5750d4ad6be0eac6bc4dbd0b985f0ef3524b07173b06de767dc40fe7e8bf69e6b5da418beccd29ec978eb3cc7b43f', 
    TRUE, 
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- B) CLIENTE CONTRATANTE PADRÃO DE REFERÊNCIA 
-- Email: consultor@bellacortintas.com.br
-- Senha Provisória Proposta: 123456
-- O hash abaixo é gerado via algoritmo PBKDF2 SHA-512
INSERT INTO public.registered_clients (
    id, name, email, representatives, current_password, has_changed_password, created_at
) VALUES (
    'bellacor-client', 
    'Bellacor Tintas S.A.', 
    'consultor@bellacortintas.com.br', 
    '[{"name": "Bruno Carvalho", "email": "consultor@bellacortintas.com.br", "role": "Diretor Comercial"}]'::jsonb, 
    '12c1d9bfe66cbce4857ed8ac31fa9fc7a72dccd31d044fa66c3038ce02fbf246ca8a892789211c4c920f5c1d3bf52eafdfa610fdf441c08d13af23b53f622be3', 
    FALSE, 
    NOW()
) ON CONFLICT (email) DO NOTHING;
```

---

## 🔒 Parâmetros de Criptografia de Senhas

O RJR Sign utiliza um sistema avançado e altamente seguro de proteção criptográfica:

* **Algoritmo:** `PBKDF2` (Password-Based Key Derivation Function 2)
* **Função HMAC:** `SHA-512`
* **Salt Geral de Segurança:** `rjr_sync_bellacor_secure_salt_987`
* **Iterações internas:** `1000`

Se você precisar gerar novas senhas manuais, lembre-se de que o sistema de login espera do banco de dados o valor codificado hexadecimal resultante deste mesmo par de hash e salt. Ao registrar novos usuários pelo próprio painel administrativo, o RJR Sign já gera fidedignamente esses hashes em tempo de faturamento no backend.
