const PERSIAN_DIGITS = new Map<string, string>([
  ["۰", "0"],
  ["۱", "1"],
  ["۲", "2"],
  ["۳", "3"],
  ["۴", "4"],
  ["۵", "5"],
  ["۶", "6"],
  ["۷", "7"],
  ["۸", "8"],
  ["۹", "9"],
  ["٠", "0"],
  ["١", "1"],
  ["٢", "2"],
  ["٣", "3"],
  ["٤", "4"],
  ["٥", "5"],
  ["٦", "6"],
  ["٧", "7"],
  ["٨", "8"],
  ["٩", "9"],
]);

const ENGLISH_TO_PERSIAN = new Map<string, string>([
  ["0", "۰"],
  ["1", "۱"],
  ["2", "۲"],
  ["3", "۳"],
  ["4", "۴"],
  ["5", "۵"],
  ["6", "۶"],
  ["7", "۷"],
  ["8", "۸"],
  ["9", "۹"],
]);

export function toEnglishDigits(input: string) {
  return (input ?? "")
    .split("")
    .map((char) => PERSIAN_DIGITS.get(char) ?? char)
    .join("");
}

export function toPersianDigits(input: string) {
  return (input ?? "")
    .split("")
    .map((char) => ENGLISH_TO_PERSIAN.get(char) ?? char)
    .join("");
}

export function normalizeIranPhone(input: string) {
  const raw = toEnglishDigits(input ?? "");
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("989") && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }
  if (digits.startsWith("9") && digits.length === 10) {
    return `0${digits}`;
  }
  if (digits.startsWith("09") && digits.length === 11) {
    return digits;
  }
  return digits;
}

export function isValidIranPhone(phone: string) {
  return /^09\d{9}$/.test(phone);
}
