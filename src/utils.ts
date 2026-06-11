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

/**
 * Generates an elegant and high-contrast legal PDF copy of the contract containing existing signatures
 */
export function generateContractPDF(contract: any) {
  const jsPDFClass = require("jspdf").jsPDF;
  const doc = new jsPDFClass({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Color Palette
  const primaryColor = [15, 23, 42]; // Slate 900
  const blueColor = [0, 82, 255]; // Corporate Blue
  const textGray = [100, 116, 139]; // Slate 500

  // 1. Header decoration
  doc.setFillColor(15, 23, 42); // slate-900 background top bar
  doc.rect(0, 0, 210, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("RJR SIGN", 15, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("PORTAL OFICIAL DE ASSINATURAS E REGISTRO JURÍDICO", 15, 20);

  // Download Badge at top-right
  doc.setFillColor(30, 41, 59);
  doc.rect(135, 10, 60, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(59, 130, 246);
  doc.text("DOCUMENTO DE ACORDO CIVIL", 138, 15);

  // Main Contract Title and Info
  let currentY = 40;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(contract.title || "Contrato Geral", 15, currentY);
  currentY += 8;

  // Metadata block
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text(`Identificador: ${contract.id}`, 15, currentY);
  currentY += 5;
  doc.text(`Categoria: ${contract.category || "Prestação de Serviços"}`, 15, currentY);
  currentY += 5;
  if (contract.value !== null && contract.value !== undefined) {
    doc.text(`Valor Comercial: ${formatCurrency(contract.value)}`, 15, currentY);
    currentY += 5;
  }
  doc.text(`Data de Geração de Acordo: ${formatDate(contract.createdAt || new Date().toISOString())}`, 15, currentY);
  currentY += 10;

  // Decorative divider line
  doc.setDrawColor(226, 232, 240);
  doc.line(15, currentY, 195, currentY);
  currentY += 10;

  // Render Contract content body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85); // Slate 700

  const contentParagraphs = (contract.content || "").split("\n");
  const maxLineWidth = 180; // Margin to margin width

  for (const paragraph of contentParagraphs) {
    if (!paragraph.trim()) {
      currentY += 4;
      continue;
    }

    let isHeading = false;
    let cleanText = paragraph;

    if (paragraph.startsWith("# ")) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      cleanText = paragraph.replace("# ", "");
      isHeading = true;
    } else if (paragraph.startsWith("## ")) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      cleanText = paragraph.replace("## ", "");
      isHeading = true;
    } else if (paragraph.startsWith("### ")) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      cleanText = paragraph.replace("### ", "");
      isHeading = true;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
    }

    const lines = doc.splitTextToSize(cleanText, maxLineWidth);
    
    // Check page overflow
    if (currentY + (lines.length * 5) > 280) {
      doc.addPage();
      currentY = 25; // padding on top
    }

    for (const line of lines) {
      doc.text(line, 15, currentY);
      currentY += 5;
    }
    
    currentY += isHeading ? 3 : 2;
  }

  // Divider before signatures
  if (currentY > 230) {
    doc.addPage();
    currentY = 25;
  } else {
    currentY += 8;
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(15, currentY, 195, currentY);
  currentY += 8;

  // Signatures Section Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("CONFORMIDADE JURÍDICA E ASSINATURAS ELETRÔNICAS", 15, currentY);
  currentY += 8;

  // Render each signer status card
  const signers = contract.signers || [];

  for (const signer of signers) {
    if (currentY + 45 > 280) {
      doc.addPage();
      currentY = 25;
    }

    // Draw box for each signature
    doc.setFillColor(248, 250, 252); // greybg
    doc.rect(15, currentY, 180, 40, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, currentY, 180, 40, "D");

    // Left info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42); // slate 900
    doc.text(signer.name || "Signatário representado", 20, currentY + 10);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text(`E-mail: ${signer.email}`, 20, currentY + 16);

    if (signer.status === "signed") {
      // Signature meta
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(22, 163, 74); // green-600
      doc.text(`✓ ASSINADO ELETRONICAMENTE`, 20, currentY + 24);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Data: ${formatDate(signer.signedAt)}`, 20, currentY + 28);
      doc.text(`IP de Origem: ${signer.signatureIp || "127.0.0.1"}`, 20, currentY + 32);

      // Render actual drawing representation at the right side of the card
      if (signer.signatureDrawing) {
        try {
          doc.addImage(signer.signatureDrawing, "PNG", 120, currentY + 5, 65, 30);
        } catch (imgError) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.text("[Representação Digital]", 130, currentY + 20);
        }
      }
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(217, 119, 6); // amber-600
      doc.text("● ASSINATURA PENDENTE", 20, currentY + 24);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Este participante provisoriamente consta como pendente.", 20, currentY + 29);
    }

    currentY += 45; // separation between blocks
  }

  // Footer seal of authenticity
  if (currentY + 25 > 280) {
    doc.addPage();
    currentY = 25;
  } else {
    currentY += 5;
  }

  doc.setFillColor(239, 246, 255);
  doc.rect(15, currentY, 180, 18, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 82, 255);
  doc.text("SINAL E ACESSORIEDADE DE AUTENTICIDADE CRIPTOGRÁFICA JURÍDICA RJR SIGN", 20, currentY + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Este documento oficial de acordo possui validade jurídica equivalente à assinatura de próprio punho com base na MP nº 2200-2/2001.", 20, currentY + 11);

  // Save Document with customized title
  const cleanTitle = (contract.title || "contrato")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_");
  doc.save(`rjr_sign_${cleanTitle}.pdf`);
}
