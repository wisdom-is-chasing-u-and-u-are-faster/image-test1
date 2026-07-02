export interface UserData {
  fullName: string;
  dob: string;
  address: string;
  documentType: string;
}

export interface OcrData {
  fullName: string;
  dob: string;
  address: string;
  documentNumber: string;
}

export interface ScreeningResult {
  passed: boolean;
  score: number; // 0 to 100
  amlStatus: 'CLEARED' | 'FLAGGED';
  livenessStatus: 'VERIFIED' | 'FAILED';
  needsManualReview: boolean;
  mismatchPercentage: number;
}

// Simple Levenshtein distance or matching helper to simulate mismatch %
export function calculateMismatch(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 0;
  if (!s1 || !s2) return 100;
  
  // Basic calculation for matching words
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const common = words1.filter(w => words2.includes(w)).length;
  const maxLen = Math.max(words1.length, words2.length);
  return Math.round((1 - common / maxLen) * 100);
}

export function performCrossValidation(user: UserData, ocr: OcrData): { mismatchPercentage: number, needsManualReview: boolean } {
  const nameMismatch = calculateMismatch(user.fullName, ocr.fullName);
  const dobMismatch = user.dob !== ocr.dob ? 50 : 0;
  const addressMismatch = calculateMismatch(user.address, ocr.address);
  
  const mismatchPercentage = Math.round((nameMismatch + dobMismatch + addressMismatch) / 3);
  const needsManualReview = mismatchPercentage > 15;
  
  return { mismatchPercentage, needsManualReview };
}

export async function screenUser(user: UserData, ocr: OcrData): Promise<ScreeningResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const { mismatchPercentage, needsManualReview } = performCrossValidation(user, ocr);
  
  // Real-time AML simulation (Simulate flag for names containing 'PEP' or 'Blocked')
  const amlStatus = user.fullName.toUpperCase().includes('PEP') || user.fullName.toUpperCase().includes('BLOCKED')
    ? 'FLAGGED'
    : 'CLEARED';
    
  const livenessStatus = 'VERIFIED';
  const score = Math.max(0, 100 - mismatchPercentage - (amlStatus === 'FLAGGED' ? 40 : 0));
  
  return {
    passed: amlStatus === 'CLEARED' && !needsManualReview,
    score,
    amlStatus,
    livenessStatus,
    needsManualReview: needsManualReview || amlStatus === 'FLAGGED',
    mismatchPercentage
  };
}
