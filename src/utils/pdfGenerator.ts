
import jsPDF from 'jspdf';
import { Quote } from '@/hooks/useQuotes';

export const generateQuotePDF = (quote: Quote) => {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(191, 22, 172); // digitalwert-primary color
  doc.text('Digitalwert', 20, 25);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Kostenvoranschlag', 20, 35);
  
  // Quote details
  doc.setFontSize(12);
  doc.text(`Angebot Nr.: ${quote.quote_number}`, 20, 50);
  doc.text(`Titel: ${quote.title}`, 20, 60);
  doc.text(`Status: ${getStatusText(quote.status)}`, 20, 70);
  doc.text(`Erstellt am: ${new Date(quote.created_at || '').toLocaleDateString('de-DE')}`, 20, 80);
  
  // Line
  doc.line(20, 90, 190, 90);
  
  // Items header
  doc.setFontSize(14);
  doc.text('Positionen:', 20, 105);
  
  // Items table
  let yPosition = 120;
  doc.setFontSize(10);
  
  // Table headers
  doc.setFont('helvetica', 'bold');
  doc.text('Leistung', 20, yPosition);
  doc.text('Beschreibung', 80, yPosition);
  doc.text('Preis', 150, yPosition);
  
  yPosition += 5;
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 10;
  
  // Table content
  doc.setFont('helvetica', 'normal');
  
  quote.items?.forEach((item) => {
    // Wrap text if needed
    const serviceText = doc.splitTextToSize(item.service, 55);
    const descriptionText = doc.splitTextToSize(item.description || '-', 65);
    const priceText = `${Number(item.price).toLocaleString('de-DE')} €`;
    
    doc.text(serviceText, 20, yPosition);
    doc.text(descriptionText, 80, yPosition);
    doc.text(priceText, 150, yPosition, { align: 'right' });
    
    yPosition += Math.max(serviceText.length, descriptionText.length) * 5 + 5;
  });
  
  // Totals
  yPosition += 10;
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 10;
  
  const totalNet = Number(quote.total_amount);
  const vat = Math.round(totalNet * 0.19);
  const totalGross = totalNet + vat;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Nettobetrag:', 120, yPosition);
  doc.text(`${totalNet.toLocaleString('de-DE')} €`, 190, yPosition, { align: 'right' });
  
  yPosition += 8;
  doc.text('MwSt. (19%):', 120, yPosition);
  doc.text(`${vat.toLocaleString('de-DE')} €`, 190, yPosition, { align: 'right' });
  
  yPosition += 8;
  doc.line(120, yPosition, 190, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Gesamtbetrag:', 120, yPosition);
  doc.text(`${totalGross.toLocaleString('de-DE')} €`, 190, yPosition, { align: 'right' });
  
  // Footer
  yPosition += 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text('Angebot gültig für 30 Tage ab Erstellung', 20, yPosition);
  doc.text('Alle Preise verstehen sich als Projektpauschale inkl. MwSt.', 20, yPosition + 6);
  
  // Download the PDF
  doc.save(`${quote.quote_number}_${quote.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
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
