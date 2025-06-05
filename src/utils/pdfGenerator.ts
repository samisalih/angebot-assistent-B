
import jsPDF from 'jspdf';
import { Quote } from '@/hooks/useQuotes';

export const generateQuotePDF = (quote: Quote) => {
  const doc = new jsPDF();
  
  // Add Titillium Web font (we'll use a similar font that's available in jsPDF)
  doc.setFont('helvetica');
  
  // Header with gradient-like background effect
  doc.setFillColor(191, 22, 172); // digitalwert-primary color
  doc.rect(0, 0, 210, 35, 'F');
  
  // Company name in header
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Digitalwert', 20, 22);
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Digitale Lösungen für Ihr Unternehmen', 20, 30);
  
  // Quote title section
  doc.setFillColor(240, 240, 240);
  doc.rect(0, 40, 210, 25, 'F');
  
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Kostenvoranschlag', 20, 55);
  
  // Quote details in modern card style
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.rect(15, 75, 180, 35, 'FD');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  // Left column
  doc.text('Angebot Nr.:', 20, 85);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(191, 22, 172);
  doc.text(quote.quote_number, 20, 92);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Titel:', 20, 102);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(quote.title, 40, 102);
  
  // Right column
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Status:', 120, 85);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 150, 0);
  doc.text(getStatusText(quote.status), 120, 92);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Erstellt am:', 120, 102);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(new Date(quote.created_at || '').toLocaleDateString('de-DE'), 145, 102);
  
  // Items section header
  let yPosition = 130;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Leistungsübersicht', 20, yPosition);
  
  yPosition += 5;
  doc.setDrawColor(191, 22, 172);
  doc.setLineWidth(2);
  doc.line(20, yPosition, 80, yPosition);
  
  yPosition += 15;
  
  // Table header with background
  doc.setFillColor(191, 22, 172);
  doc.rect(15, yPosition - 8, 180, 12, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Leistung', 20, yPosition - 2);
  doc.text('Beschreibung', 90, yPosition - 2);
  doc.text('Preis', 170, yPosition - 2);
  
  yPosition += 8;
  
  // Table content with alternating row colors
  doc.setFont('helvetica', 'normal');
  let isEvenRow = false;
  
  quote.items?.forEach((item, index) => {
    // Alternating row background
    if (isEvenRow) {
      doc.setFillColor(248, 248, 248);
      doc.rect(15, yPosition - 5, 180, 10, 'F');
    }
    
    doc.setTextColor(0, 0, 0);
    
    // Service name (bold)
    doc.setFont('helvetica', 'bold');
    const serviceText = doc.splitTextToSize(item.service, 65);
    doc.text(serviceText, 20, yPosition);
    
    // Description
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const descriptionText = doc.splitTextToSize(item.description || 'Keine Beschreibung', 50);
    doc.text(descriptionText, 90, yPosition);
    
    // Price (right aligned, colored)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(191, 22, 172);
    const priceText = `${Number(item.price).toLocaleString('de-DE')} €`;
    doc.text(priceText, 190, yPosition, { align: 'right' });
    
    const lineHeight = Math.max(serviceText.length, descriptionText.length) * 4 + 6;
    yPosition += lineHeight;
    isEvenRow = !isEvenRow;
  });
  
  // Totals section with modern styling
  yPosition += 10;
  
  // Total box background
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(200, 200, 200);
  doc.rect(120, yPosition - 5, 75, 35, 'FD');
  
  const totalNet = Number(quote.total_amount);
  const vat = Math.round(totalNet * 0.19);
  const totalGross = totalNet + vat;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  // Net amount
  doc.text('Nettobetrag:', 125, yPosition + 5);
  doc.setTextColor(0, 0, 0);
  doc.text(`${totalNet.toLocaleString('de-DE')} €`, 185, yPosition + 5, { align: 'right' });
  
  // VAT
  doc.setTextColor(80, 80, 80);
  doc.text('MwSt. (19%):', 125, yPosition + 12);
  doc.setTextColor(0, 0, 0);
  doc.text(`${vat.toLocaleString('de-DE')} €`, 185, yPosition + 12, { align: 'right' });
  
  // Separator line
  doc.setDrawColor(191, 22, 172);
  doc.setLineWidth(1);
  doc.line(125, yPosition + 16, 190, yPosition + 16);
  
  // Total amount (highlighted)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(191, 22, 172);
  doc.text('Gesamtbetrag:', 125, yPosition + 25);
  doc.text(`${totalGross.toLocaleString('de-DE')} €`, 185, yPosition + 25, { align: 'right' });
  
  // Footer section
  yPosition += 50;
  
  // Footer background
  doc.setFillColor(245, 245, 245);
  doc.rect(0, yPosition - 5, 210, 25, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  // Footer text
  doc.text('Gültigkeitsdauer: 30 Tage ab Erstellungsdatum', 20, yPosition + 5);
  doc.text('Alle Preise verstehen sich als Projektpauschalen inkl. 19% MwSt.', 20, yPosition + 12);
  doc.text('Bei Fragen kontaktieren Sie uns gerne unter info@digitalwert.de', 20, yPosition + 19);
  
  // Contact info in footer
  doc.setTextColor(191, 22, 172);
  doc.text('www.digitalwert.de', 150, yPosition + 5);
  doc.text('Tel: +49 (0) 123 456789', 150, yPosition + 12);
  
  // Download the PDF with clean filename
  const cleanTitle = quote.title.replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, '').replace(/\s+/g, '_');
  doc.save(`Angebot_${quote.quote_number}_${cleanTitle}.pdf`);
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'draft': return 'Entwurf';
    case 'sent': return 'Versendet';
    case 'accepted': return 'Angenommen';
    case 'rejected': return 'Abgelehnt';
    default: return status;
  }
};
