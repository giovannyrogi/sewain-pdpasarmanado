const WORDS = [
  "",
  "Satu",
  "Dua",
  "Tiga",
  "Empat",
  "Lima",
  "Enam",
  "Tujuh",
  "Delapan",
  "Sembilan",
  "Sepuluh",
  "Sebelas",
];

export const numberToWords = (value) => {
  const num = Math.floor(Number(value || 0));

  if (num < 0) return `Minus ${numberToWords(Math.abs(num))}`;
  if (num < 12) return WORDS[num];
  if (num < 20) return `${numberToWords(num - 10)} Belas`.trim();
  if (num < 100) {
    return `${numberToWords(Math.floor(num / 10))} Puluh ${numberToWords(
      num % 10
    )}`.trim();
  }
  if (num < 200) return `Seratus ${numberToWords(num - 100)}`.trim();
  if (num < 1000) {
    return `${numberToWords(Math.floor(num / 100))} Ratus ${numberToWords(
      num % 100
    )}`.trim();
  }
  if (num < 2000) return `Seribu ${numberToWords(num - 1000)}`.trim();
  if (num < 1000000) {
    return `${numberToWords(Math.floor(num / 1000))} Ribu ${numberToWords(
      num % 1000
    )}`.trim();
  }
  if (num < 1000000000) {
    return `${numberToWords(Math.floor(num / 1000000))} Juta ${numberToWords(
      num % 1000000
    )}`.trim();
  }
  if (num < 1000000000000) {
    return `${numberToWords(Math.floor(num / 1000000000))} Miliar ${numberToWords(
      num % 1000000000
    )}`.trim();
  }
  if (num < 1000000000000000) {
    return `${numberToWords(Math.floor(num / 1000000000000))} Triliun ${numberToWords(
      num % 1000000000000
    )}`.trim();
  }

  return "Angka terlalu besar";
};

export const rupiahInWords = (value) => {
  const words = numberToWords(value);
  return words ? `${words} Rupiah` : "Nol Rupiah";
};
