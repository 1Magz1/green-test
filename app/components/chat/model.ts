export interface Chat {
  /** Совпадает с номером телефона (только цифры), поэтому уникален */
  id: string;
  phone: string;
}

export interface Message {
  id: string;
  text: string;
  outgoing: boolean;
}

/** "+7 (999) 123-45-67" -> "79991234567" */
export function normalizePhone(input: string): string {
  return input.replace(/\D/g, "");
}

/** "79991234567" -> "+7 999 123 45 67". Остальные длины: просто "+цифры" */
export function formatPhone(digits: string): string {
  if (digits.length === 11) {
    return `+${digits[0]} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }
  return `+${digits}`;
}
