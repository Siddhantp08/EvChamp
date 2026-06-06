const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS cell_audits (
        id SERIAL PRIMARY KEY,
        audit_id TEXT UNIQUE NOT NULL,
        qr_raw TEXT,
        serial_number TEXT NOT NULL,
        manufacturer TEXT,
        manufacturer_code TEXT,
        model TEXT,
        model_code TEXT,
        chemistry TEXT,
        chemistry_code TEXT,
        production_type TEXT,
        production_line TEXT,
        task_code TEXT,
        factory_address TEXT,
        factory_identifier TEXT,
        production_date TEXT,
        capacity TEXT,
        voltage TEXT,
        country_of_origin TEXT,
        qr_authenticity_score INTEGER,
        qr_validation_status TEXT,
        auth_check_score INTEGER,
        auth_check_status TEXT,
        auth_check_details JSONB,
        certificate_number TEXT,
        certificate_generated BOOLEAN DEFAULT FALSE,
        cell_data JSONB,
        audited_by TEXT,
        audited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_cell_audits_serial ON cell_audits(serial_number)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_cell_audits_qr ON cell_audits(qr_raw)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_cell_audits_audit_id ON cell_audits(audit_id)
    `;

    console.log('✅ Neon DB: cell_audits table ready');

    // Users table for Clerk sign-in sync
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        clerk_id TEXT UNIQUE NOT NULL,
        email TEXT,
        first_name TEXT,
        last_name TEXT,
        image_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_sign_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id)
    `;
    console.log('✅ Neon DB: users table ready');

    return true;
  } catch (err) {
    console.error('❌ Neon DB init failed:', err.message);
    return false;
  }
}

async function upsertUser({ clerkId, email, firstName, lastName, imageUrl }) {
  const result = await sql`
    INSERT INTO users (clerk_id, email, first_name, last_name, image_url, last_sign_in_at)
    VALUES (${clerkId}, ${email}, ${firstName}, ${lastName}, ${imageUrl}, NOW())
    ON CONFLICT (clerk_id) DO UPDATE SET
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      image_url = EXCLUDED.image_url,
      last_sign_in_at = NOW()
    RETURNING *
  `;
  return result[0];
}

async function saveAudit(auditData) {
  const {
    auditId, qrRaw, serialNumber, manufacturer, manufacturerCode,
    model, modelCode, chemistry, chemistryCode, productionType,
    productionLine, taskCode, factoryAddress, factoryIdentifier,
    productionDate, capacity, voltage, countryOfOrigin,
    qrAuthenticityScore, qrValidationStatus,
    authCheckScore, authCheckStatus, authCheckDetails,
    certificateNumber, certificateGenerated,
    cellData, auditedBy
  } = auditData;

  const result = await sql`
    INSERT INTO cell_audits (
      audit_id, qr_raw, serial_number, manufacturer, manufacturer_code,
      model, model_code, chemistry, chemistry_code, production_type,
      production_line, task_code, factory_address, factory_identifier,
      production_date, capacity, voltage, country_of_origin,
      qr_authenticity_score, qr_validation_status,
      auth_check_score, auth_check_status, auth_check_details,
      certificate_number, certificate_generated,
      cell_data, audited_by
    ) VALUES (
      ${auditId}, ${qrRaw || null}, ${serialNumber}, ${manufacturer || null}, ${manufacturerCode || null},
      ${model || null}, ${modelCode || null}, ${chemistry || null}, ${chemistryCode || null}, ${productionType || null},
      ${productionLine || null}, ${taskCode || null}, ${factoryAddress || null}, ${factoryIdentifier || null},
      ${productionDate || null}, ${capacity || null}, ${voltage || null}, ${countryOfOrigin || null},
      ${qrAuthenticityScore || null}, ${qrValidationStatus || null},
      ${authCheckScore || null}, ${authCheckStatus || null}, ${JSON.stringify(authCheckDetails || null)},
      ${certificateNumber || null}, ${certificateGenerated || false},
      ${JSON.stringify(cellData || null)}, ${auditedBy || null}
    )
    RETURNING *
  `;
  return result[0];
}

async function getAuditBySerial(serialNumber) {
  const results = await sql`
    SELECT * FROM cell_audits WHERE serial_number = ${serialNumber}
    ORDER BY created_at DESC
  `;
  return results;
}

async function getAuditById(auditId) {
  const results = await sql`
    SELECT * FROM cell_audits WHERE audit_id = ${auditId}
  `;
  return results[0] || null;
}

async function getAllAudits(limit = 50, offset = 0) {
  const results = await sql`
    SELECT * FROM cell_audits
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return results;
}

async function updateCertificate(auditId, certificateNumber) {
  const result = await sql`
    UPDATE cell_audits
    SET certificate_number = ${certificateNumber}, certificate_generated = true
    WHERE audit_id = ${auditId}
    RETURNING *
  `;
  return result[0] || null;
}

module.exports = { sql, initDB, saveAudit, getAuditBySerial, getAuditById, getAllAudits, updateCertificate, upsertUser };
