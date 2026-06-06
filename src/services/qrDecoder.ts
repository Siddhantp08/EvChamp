// ============================================================
// QR Code Decoder for 24-digit Battery Cell Identity Strings
// Format: 040CB76717900JB5S0005806
//   D1-D3:   Vendor Code        (040 → EVE)
//   D4:      Production Type    (C → Cell)
//   D5:      Cell Type/Chemistry(B → LiFePO4)
//   D6-D7:   Model Code         (76 → LF280K)
//   D8-D9:   Production Line    (71)
//   D10-D11: Task Code          (79)
//   D12-D13: Factory Address    (00 → Jingmen)
//   D14:     Factory Identifier (J)
//   D15-D17: Production Date    (B5S → 2021-May-29)
//            Year:  1-9=2011-2019, A-Z=2020-2045
//            Month: 1-9=Jan-Sep,  A=Oct, B=Nov, C=Dec
//            Day:   1-9=1st-9th,  A-V=10th-31st
//   D18-D24: Product Serial No  (0005806)
// ============================================================

// Vendor code mapping (D1–D3) — can be numeric or alphanumeric
const MANUFACTURER_MAP: Record<string, string> = {
  '001': 'CATL',
  '002': 'Samsung SDI',
  '003': 'LG Energy Solution',
  '004': 'Panasonic',
  '005': 'SK Innovation',
  '006': 'AESC (Envision)',
  '007': 'Gotion High-Tech',
  '008': 'CALB',
  '009': 'BYD',
  '010': 'Lishen',
  '011': 'Sunwoda',
  '012': 'Farasis Energy',
  '013': 'Svolt Energy',
  '014': 'Rept Battero',
  '015': 'Coslight',
  '020': 'Toshiba',
  '030': 'Murata',
  '040': 'EVE',
  '04Q': 'EVE',
  '04R': 'EVE',
  '04S': 'EVE',
  '041': 'EVE',
  '042': 'EVE',
  '050': 'Phylion',
  '060': 'BAK Battery',
  '070': 'Highstar',
  '080': 'Great Power',
  '090': 'Ampere',
  '100': 'Exide',
  '00A': 'CATL',
  '00B': 'CATL',
  '00C': 'CATL',
  '00D': 'BYD',
  '00E': 'BYD',
  '01A': 'Samsung SDI',
  '01B': 'LG Energy Solution',
  '02A': 'Gotion High-Tech',
  '03A': 'CALB',
};

// Production type mapping (D4)
const PRODUCT_TYPE_MAP: Record<string, string> = {
  'C': 'Cell',
  'P': 'Pack',
  'M': 'Module',
  'B': 'Battery',
};

// Cell type / chemistry mapping (D5)
const CHEMISTRY_MAP: Record<string, string> = {
  'A': 'NMC (Nickel Manganese Cobalt)',
  'B': 'LFP (LiFePO4)',
  'C': 'NCA (Nickel Cobalt Aluminium)',
  'D': 'LTO (Lithium Titanate)',
  'E': 'LMO (Lithium Manganese Oxide)',
  'F': 'LCO (Lithium Cobalt Oxide)',
  'G': 'Sodium-Ion',
  'H': 'Solid-State',
};

// Model code mapping (D6-D7) — known models
const MODEL_MAP: Record<string, string> = {
  '76': 'LF280K',
  '77': 'LF304',
  '78': 'LF272',
  '50': 'LF50',
  '60': 'LF60',
  '80': 'MB31',
};

// Factory address mapping (D12-D13)
const FACTORY_MAP: Record<string, string> = {
  '00': 'Jingmen',
  '01': 'Huizhou',
  '02': 'Liyang',
  '03': 'Chongqing',
  '04': 'Jingmen Phase II',
  '05': 'Malaysia',
};

// ---- Date decoding helpers ----
// Year: 1-9 = 2011-2019, A-Z = 2020-2045
function decodeYear(ch: string): number | null {
  if (/^[1-9]$/.test(ch)) return 2010 + parseInt(ch, 10);
  if (/^[A-Z]$/i.test(ch)) return 2020 + (ch.toUpperCase().charCodeAt(0) - 65);
  return null;
}

// Month: 1-9 = Jan-Sep, A = Oct, B = Nov, C = Dec
function decodeMonth(ch: string): number | null {
  if (/^[1-9]$/.test(ch)) return parseInt(ch, 10);
  const upper = ch.toUpperCase();
  if (upper === 'A') return 10;
  if (upper === 'B') return 11;
  if (upper === 'C') return 12;
  return null;
}

// Day: 1-9 = 1-9, A-V = 10-31
function decodeDay(ch: string): number | null {
  if (/^[1-9]$/.test(ch)) return parseInt(ch, 10);
  if (/^[A-V]$/i.test(ch)) return 10 + (ch.toUpperCase().charCodeAt(0) - 65);
  return null;
}

function decodeDate(raw: string): { year: number; month: number; day: number; formatted: string } | null {
  if (raw.length !== 3) return null;
  const year = decodeYear(raw[0]);
  const month = decodeMonth(raw[1]);
  const day = decodeDay(raw[2]);
  if (year === null || month === null || day === null) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dateObj = new Date(year, month - 1, day);
  const formatted = dateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  return { year, month, day, formatted };
}

export interface DecodedQR {
  raw: string;
  manufacturerCode: string;       // D1-D3
  manufacturer: string;
  productTypeCode: string;         // D4
  productType: string;
  chemistryCode: string;           // D5
  chemistry: string;
  modelCode: string;               // D6-D7
  model: string;
  productionLine: string;          // D8-D9
  taskCode: string;                // D10-D11
  factoryAddressCode: string;      // D12-D13
  factoryAddress: string;
  factoryIdentifier: string;       // D14
  productionDateRaw: string;       // D15-D17 (3 encoded chars)
  productionDate: string;          // human-readable date
  serialNumber: string;            // D18-D24 (7 chars)
}

export interface QRValidation {
  isValid: boolean;
  warnings: string[];
  authenticity_score: number;
  status: 'Likely Genuine' | 'Suspicious' | 'Possible Counterfeit';
  checks: { label: string; pass: boolean; detail: string }[];
}

/**
 * Parse a 24-character QR string into decoded battery metadata
 */
export function decodeQRString(raw: string): DecodedQR | null {
  const cleaned = raw.trim().toUpperCase();
  if (cleaned.length !== 24) return null;

  const manufacturerCode = cleaned.substring(0, 3);     // D1-D3
  const productTypeCode  = cleaned.substring(3, 4);      // D4
  const chemistryCode    = cleaned.substring(4, 5);      // D5
  const modelCode        = cleaned.substring(5, 7);      // D6-D7
  const productionLine   = cleaned.substring(7, 9);      // D8-D9
  const taskCode         = cleaned.substring(9, 11);     // D10-D11
  const factoryAddrCode  = cleaned.substring(11, 13);    // D12-D13
  const factoryId        = cleaned.substring(13, 14);    // D14
  const dateRaw          = cleaned.substring(14, 17);    // D15-D17
  const serialNumber     = cleaned.substring(17, 24);    // D18-D24

  const dateDecoded = decodeDate(dateRaw);

  return {
    raw: cleaned,
    manufacturerCode,
    manufacturer: MANUFACTURER_MAP[manufacturerCode] || `Unknown (${manufacturerCode})`,
    productTypeCode,
    productType: PRODUCT_TYPE_MAP[productTypeCode] || `Unknown (${productTypeCode})`,
    chemistryCode,
    chemistry: CHEMISTRY_MAP[chemistryCode] || `Unknown (${chemistryCode})`,
    modelCode,
    model: MODEL_MAP[modelCode] || `Unknown (${modelCode})`,
    productionLine,
    taskCode,
    factoryAddressCode: factoryAddrCode,
    factoryAddress: FACTORY_MAP[factoryAddrCode] || `Unknown (${factoryAddrCode})`,
    factoryIdentifier: factoryId,
    productionDateRaw: dateRaw,
    productionDate: dateDecoded ? dateDecoded.formatted : dateRaw,
    serialNumber,
  };
}

/**
 * Validate the decoded QR data and produce an authenticity report
 */
export function validateQR(decoded: DecodedQR): QRValidation {
  const checks: { label: string; pass: boolean; detail: string }[] = [];
  const warnings: string[] = [];

  // 1. QR length
  checks.push({
    label: 'QR Length (24 chars)',
    pass: decoded.raw.length === 24,
    detail: decoded.raw.length === 24 ? `Valid: ${decoded.raw.length} characters` : `Invalid: ${decoded.raw.length} characters`,
  });
  if (decoded.raw.length !== 24) warnings.push('Invalid QR length');

  // 2. Vendor code exists in database
  const knownMfg = decoded.manufacturerCode in MANUFACTURER_MAP;
  checks.push({
    label: 'Vendor Code',
    pass: knownMfg,
    detail: knownMfg ? `Registered: ${decoded.manufacturer}` : `Unknown code: ${decoded.manufacturerCode}`,
  });
  if (!knownMfg) warnings.push('Unknown vendor code');

  // 3. Production type valid
  const knownType = decoded.productTypeCode in PRODUCT_TYPE_MAP;
  checks.push({
    label: 'Production Type',
    pass: knownType,
    detail: knownType ? decoded.productType : `Unknown type: ${decoded.productTypeCode}`,
  });
  if (!knownType) warnings.push('Unknown production type code');

  // 4. Cell type / chemistry code valid
  const knownChem = decoded.chemistryCode in CHEMISTRY_MAP;
  checks.push({
    label: 'Cell Type / Chemistry',
    pass: knownChem,
    detail: knownChem ? decoded.chemistry : `Unknown cell type: ${decoded.chemistryCode}`,
  });
  if (!knownChem) warnings.push('Unknown cell type code');

  // 5. Production date decodable
  const dateDecoded = decodeDate(decoded.productionDateRaw);
  const dateValid = dateDecoded !== null;
  checks.push({
    label: 'Production Date',
    pass: dateValid,
    detail: dateValid ? `${dateDecoded!.formatted} (${decoded.productionDateRaw})` : `Cannot decode: ${decoded.productionDateRaw}`,
  });
  if (!dateValid) warnings.push('Invalid encoded production date');

  // 6. Serial number structure (7 numeric/alphanumeric chars)
  const serialValid = /^[A-Z0-9]{7}$/i.test(decoded.serialNumber);
  checks.push({
    label: 'Product Serial No.',
    pass: serialValid,
    detail: serialValid ? `Valid: ${decoded.serialNumber}` : `Invalid structure: ${decoded.serialNumber}`,
  });
  if (!serialValid) warnings.push('Invalid serial number structure');

  // 7. Model code structure
  const modelValid = /^[A-Z0-9]{2}$/i.test(decoded.modelCode);
  checks.push({
    label: 'Model Code',
    pass: modelValid,
    detail: modelValid ? `${decoded.model} (${decoded.modelCode})` : `Invalid: ${decoded.modelCode}`,
  });

  // Score calculation
  const passed = checks.filter((c) => c.pass).length;
  const authenticity_score = Math.round((passed / checks.length) * 100);

  let status: QRValidation['status'] = 'Possible Counterfeit';
  if (authenticity_score >= 80) status = 'Likely Genuine';
  else if (authenticity_score >= 50) status = 'Suspicious';

  return { isValid: warnings.length === 0, warnings, authenticity_score, status, checks };
}

/**
 * Check if a string looks like a 24-digit encoded QR identity
 */
export function is24DigitQR(value: string): boolean {
  return /^[A-Z0-9]{24}$/i.test(value.trim());
}
