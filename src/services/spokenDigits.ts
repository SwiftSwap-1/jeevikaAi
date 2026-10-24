// Turns what a person says ("नौ आठ सात छह ...", "9 8 7 6", "nau aath saat") into a string of digits.

const WORDS: Record<string, string> = {
  // Hindi / Bhojpuri
  'शून्य': '0', 'जीरो': '0', 'ज़ीरो': '0', 'सुन्ना': '0',
  'एक': '1', 'दो': '2', 'तीन': '3', 'चार': '4',
  'पांच': '5', 'पाँच': '5', 'पाच': '5',
  'छह': '6', 'छः': '6', 'छे': '6', 'छ': '6', 'छै': '6',
  'सात': '7', 'आठ': '8', 'नौ': '9', 'नो': '9',
  // Hinglish
  'shunya': '0', 'zero': '0', 'jero': '0',
  'ek': '1', 'one': '1',
  'do': '2', 'two': '2',
  'teen': '3', 'tin': '3', 'three': '3',
  'char': '4', 'chaar': '4', 'four': '4',
  'paanch': '5', 'panch': '5', 'five': '5',
  'chhe': '6', 'chhah': '6', 'cheh': '6', 'chhey': '6', 'six': '6',
  'saat': '7', 'sat': '7', 'seven': '7',
  'aath': '8', 'ath': '8', 'eight': '8',
  'nau': '9', 'nine': '9',
};

const DEVANAGARI_DIGITS = '०१२३४५६७८९';

export function parseSpokenDigits(text: string): string {
  if (!text) return '';
  const cleaned = text
    .toLowerCase()
    .replace(/[०-९]/g, (c) => String(DEVANAGARI_DIGITS.indexOf(c)))
    .replace(/[,.\-।]/g, ' ');
  let out = '';
  for (const token of cleaned.split(/\s+/)) {
    if (!token) continue;
    if (/^\d+$/.test(token)) {
      out += token;
    } else if (WORDS[token] !== undefined) {
      out += WORDS[token];
    }
  }
  return out;
}
