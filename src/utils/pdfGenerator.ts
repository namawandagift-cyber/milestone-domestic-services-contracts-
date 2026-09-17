import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function downloadContractPdf(
  elementId: string,
  contractNumber: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Contract element not found for PDF generation');
  }

  // Create high-res canvas snapshot of the actual contract document
  const canvas = await html2canvas(element, {
    scale: 2, // 2x for sharp print quality
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Render first page
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  // Add subsequent pages if the contract is multi-page
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  const sanitizedFilename = `Contract_${contractNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_Signed.pdf`;
  pdf.save(sanitizedFilename);
}

export function printContractDocument(): void {
  window.print();
}
