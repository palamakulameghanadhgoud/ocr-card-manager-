import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

/**
 * Extract contact info from OCR text using regex and layout heuristics.
 * Name vs Company: We strictly differentiate - company only when clearly identified
 * (Inc/LLC/Corp). If company appears only as a logo, leave empty for user to enter.
 * Industry, relationship, priority are never extracted - user selects from dropdowns (default: None).
 */
function parseOCRText(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const fullText = text;

  const result = {
    name: '',
    company: '',
    jobTitle: '',
    phone: '',
    email: '',
    website: '',
    address: '',
  };

  // 1. Structured contact info (regex)
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\+?[\d\s\-().]{10,}/g;
  const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g;

  const emails = fullText.match(emailRegex) || [];
  const phones = fullText.match(phoneRegex) || [];
  const websites = fullText.match(websiteRegex) || [];

  if (emails.length > 0) result.email = emails[0].trim();
  if (phones.length > 0) result.phone = phones[0].replace(/\s+/g, ' ').trim();
  if (websites.length > 0) result.website = websites[0].trim();

  // 2. Address
  const addressLine = lines.find(
    (l) =>
      l.length >= 12 &&
      /\d/.test(l) &&
      /,|St\.?|Ave\.?|Rd\.?|Blvd\.?|Street|Avenue|Road|Lane|Dr\.?|Court/i.test(l) &&
      !l.match(emailRegex) &&
      !l.match(phoneRegex)
  );
  if (addressLine) result.address = addressLine;

  const isContactLine = (s) =>
    /@|\.com|\.org|\.net|https?:\/\//i.test(s) ||
    /^\+?\d[\d\s\-().]{8,}$/.test(s) ||
    s.length < 3;

  const contentLines = lines.filter((l) => !isContactLine(l));

  const jobTitleKeywords = /manager|director|ceo|cfo|president|vp|vice president|engineer|analyst|specialist|coordinator|consultant|agent|representative|executive|officer|head|lead|senior|junior|assistant/i;
  const companySuffixRegex = /\b(inc\.?|llc|ltd\.?|corp\.?|co\.?)\s*$/i;

  // Industry/slogan words - never treat as company name (e.g. "REAL ESTATE")
  const industrySloganWords = new Set(
    'real estate technology healthcare finance marketing sales consulting services solutions'.split(' ')
  );

  // 3. Company - ONLY when clearly identified (Inc, LLC, Corp, Ltd). Logos are not readable.
  const companyLine = contentLines.find(
    (l) => companySuffixRegex.test(l) && l.length < 60
  );
  if (companyLine) result.company = companyLine;

  // 4. Job title
  const jobTitleLine = contentLines.find(
    (l) => jobTitleKeywords.test(l) && l.length < 50
  );
  if (jobTitleLine) result.jobTitle = jobTitleLine;

  // 5. Name - Personal name (2–4 words). Must NOT look like company or industry.
  const nonNameWords = new Set([
    ...industrySloganWords,
    'inc', 'llc', 'ltd', 'corp', 'group', 'international', 'global', 'the', 'and', 'of',
  ]);
  const isLikelyName = (s) => {
    if (s.length < 4 || s.length > 40) return false;
    if (companySuffixRegex.test(s) || jobTitleKeywords.test(s)) return false;
    if (/\d|@|\.com|inc\.|llc|ltd/i.test(s)) return false;
    const words = s.split(/\s+/);
    if (words.length < 2 || words.length > 4) return false;
    if (words.some((w) => nonNameWords.has(w.toLowerCase()))) return false;
    return words.every((w) =>
      /^[A-Z][a-z]+$/.test(w) || /^[A-Z][a-z]*\.?$/.test(w) || /^[A-Z]{2,}$/.test(w)
    );
  };
  const nameLine = contentLines.find(
    (l) => isLikelyName(l) && l !== result.jobTitle && l !== result.company
  );
  if (nameLine) result.name = nameLine;

  // No fallbacks for company - if not detected (e.g. logo-only), user enters manually.
  // No fallbacks for name/company that could mix them up.

  return result;
}

export async function extractTextFromImage(imagePath) {
  const absolutePath = path.isAbsolute(imagePath) ? imagePath : path.resolve(imagePath);
  const imageBuffer = fs.readFileSync(absolutePath);

  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(imageBuffer);
    return parseOCRText(data.text);
  } finally {
    await worker.terminate();
  }
}
