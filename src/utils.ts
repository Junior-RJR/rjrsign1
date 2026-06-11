/**
 * RJR Sync helper functions
 */

/**
 * Translates typical Google Drive share links into static direct file rendering URLs.
 * Works for images in tags and downloads.
 */
export function parseGoogleDriveLink(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  
  if (trimmed.includes("drive.google.com")) {
    // Matches file id patterns e.g: /file/d/[ID]/view or ?id=[ID]
    const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://docs.google.com/uc?export=view&id=${fileIdMatch[1]}`;
    }
  }
  return trimmed;
}

/**
 * Formats a given number into standard Brazilian Real (BRL) currency layout.
 */
export function formatCurrency(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

/**
 * Formats standard date strings into pt-BR formatting.
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(d);
  } catch (e) {
    return dateString;
  }
}

/**
 * Applies a robust mask to standard corporate CNPJs
 */
export function maskCNPJ(value: string): string {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 14) {
    return clean
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return clean.substring(0, 14);
}

/**
 * Applies a mask to standard telephones
 */
export function maskPhone(value: string): string {
  const clean = value.replace(/\D/g, "");
  if (clean.length > 10) {
    return clean.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (clean.length > 5) {
    return clean.replace(/^(\d{2})(\d{4})(\d{4,5})/, "($1) $2-$3");
  } else if (clean.length > 2) {
    return clean.replace(/^(\d{2})(\d)/, "($1) $2");
  }
  return clean;
}
