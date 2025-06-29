import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from "react-toastify";

/**
 * Print Report Utility
 * Handles professional printing of reports with custom styling
 */
export const printReport = () => {
  // Add print-specific styling to the page
  const printStyles = document.createElement('style');
  printStyles.id = 'print-styles';
  printStyles.textContent = `
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        font-size: 12px !important;
        line-height: 1.4 !important;
        direction: rtl !important;
        margin: 0 !important;
        padding: 15mm !important;
        background: white !important;
        color: black !important;
      }
      
      /* Hide everything except the printable report */
      body * {
        visibility: hidden;
      }
      
      #printable-report,
      #printable-report * {
        visibility: visible;
      }
      
      #printable-report {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      
      /* Hide print header completely */
      .print-header {
        display: none !important;
      }
      
      /* Association header styling for print */
      .association-header {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        position: relative !important;
        margin-bottom: 20px !important;
        padding: 15px !important;
        border-bottom: 3px solid #518664 !important;
        background: white !important;
        page-break-inside: avoid !important;
      }
      
      .association-info {
        text-align: center !important;
        z-index: 1 !important;
      }
      
      .association-logo {
        position: absolute !important;
        right: 15px !important;
        z-index: 2 !important;
      }
      
      .report-logo {
        width: 60px !important;
        height: 60px !important;
        object-fit: contain !important;
        border-radius: 50% !important;
        border: 2px solid #518664 !important;
        padding: 3px !important;
        background: white !important;
      }
      
      .association-title {
        color: #518664 !important;
        font-size: 24px !important;
        font-weight: bold !important;
        margin: 0 !important;
        white-space: nowrap !important;
      }
      
      .association-subtitle {
        color: #666 !important;
        font-size: 12px !important;
        margin: 5px 0 0 0 !important;
        font-style: italic !important;
        white-space: nowrap !important;
        text-align: center !important;
      }
      
      /* Report title styling */
      .report-title {
        margin: 0 !important;
        padding: 0 !important;
        border-bottom: 2px solid #518664 !important;
        padding-bottom: 10px !important;
      }
      
      .report-title h2 {
        color: #518664 !important;
        font-size: 22px !important;
        font-weight: bold !important;
        text-align: center !important;
        margin: 0 0 10px 0 !important;
        border: none !important;
        padding: 0 !important;
      }
      
      .report-period,
      .report-generated {
        text-align: center !important;
        font-size: 11px !important;
        color: #666 !important;
        margin: 5px 0 !important;
      }
      
      /* Summary cards styling */
      .summary-cards {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 15px !important;
        margin: 20px 0 !important;
        justify-content: space-around !important;
      }
      
      .summary-card {
        border: 1px solid #518664 !important;
        border-radius: 6px !important;
        padding: 12px !important;
        background: #f8f9fa !important;
        min-width: 180px !important;
        flex: 1 !important;
        max-width: 300px !important;
      }
      
      .summary-card h4 {
        color: #518664 !important;
        font-size: 14px !important;
        font-weight: bold !important;
        margin: 0 0 8px 0 !important;
        text-align: right !important;
      }
      
      .summary-card p {
        margin: 4px 0 !important;
        font-size: 11px !important;
        color: #333 !important;
        text-align: right !important;
      }
      
      /* Chart styling for print */
      .chart-section {
        background: white !important;
        border: 1px solid #333 !important;
        page-break-inside: avoid !important;
        margin-bottom: 15px !important;
      }
      
      .chart-container {
        height: 250px !important;
        box-shadow: none !important;
        border: 1px solid #ddd !important;
      }
      
      .chart-section h3 {
        color: #333 !important;
        border-bottom: 1px solid #333 !important;
      }
      
      /* Table styling */
      .report-section {
        margin: 25px 0 !important;
        page-break-inside: avoid !important;
      }
      
      .report-section h3 {
        color: #518664 !important;
        font-size: 16px !important;
        font-weight: bold !important;
        margin: 0 0 12px 0 !important;
        text-align: right !important;
        border-bottom: 1px solid #518664 !important;
        padding-bottom: 5px !important;
      }
      
      .report-table {
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 10px !important;
        margin-top: 10px !important;
      }
      
      .report-table th {
        background-color: #518664 !important;
        color: white !important;
        padding: 8px 6px !important;
        text-align: right !important;
        font-weight: bold !important;
        border: 1px solid #518664 !important;
      }
      
      .report-table td {
        padding: 6px !important;
        text-align: right !important;
        border: 1px solid #ddd !important;
        background: white !important;
      }
      
      .report-table tr:nth-child(even) td {
        background-color: #f8f9fa !important;
      }
      
      /* No data message */
      .no-data {
        text-align: center !important;
        padding: 30px !important;
        color: #666 !important;
        font-style: italic !important;
      }
      
      /* Page break control */
      .summary-cards {
        page-break-inside: avoid !important;
      }
      
      .report-section {
        page-break-inside: avoid !important;
      }
      
      /* Add header to each page */
      @page {
        margin: 15mm;
        @top-center {
          content: "דו״ח מערכת ניהול מלאי";
        }
        @bottom-center {
          content: "עמוד " counter(page) " מתוך " counter(pages);
        }
      }
    }
  `;
  
  // Remove existing print styles if any
  const existingStyles = document.getElementById('print-styles');
  if (existingStyles) {
    existingStyles.remove();
  }
  
  // Add the print styles to head
  document.head.appendChild(printStyles);
  
  // Add print timestamp to the report
  const printableReport = document.getElementById('printable-report');
  if (printableReport) {
    // Add print date if not exists
    let printDate = printableReport.querySelector('.print-timestamp');
    if (!printDate) {
      printDate = document.createElement('div');
      printDate.className = 'print-timestamp';
      printDate.style.cssText = 'text-align: center; font-size: 11px; color: #666; margin-top: 15px; display: none;';
      printDate.innerHTML = `נדפס בתאריך: ${new Date().toLocaleDateString('he-IL')} בשעה: ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
      printableReport.appendChild(printDate);
    }
    
    // Show print timestamp only during print
    printDate.style.display = 'block';
    
    // Trigger print
    setTimeout(() => {
      window.print();
      
      // Hide print timestamp after print
      setTimeout(() => {
        printDate.style.display = 'none';
        // Remove print styles after printing
        const printStylesElement = document.getElementById('print-styles');
        if (printStylesElement) {
          printStylesElement.remove();
        }
      }, 1000);
    }, 100);
    
  } else {
    toast.error('לא נמצא תוכן להדפסה');
  }
};

/**
 * Export to PDF Utility
 * Generates and downloads a PDF version of the report
 */
export const exportToPDF = async () => {
  const printableReport = document.getElementById('printable-report');
  if (!printableReport) {
    toast.error('לא נמצא תוכן להפקת PDF');
    return;
  }

  try {
    
    // Create a loading overlay to prevent user interaction
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      color: white;
      font-size: 18px;
      font-weight: bold;
    `;
    loadingOverlay.innerHTML = 'מייצר PDF...';
    document.body.appendChild(loadingOverlay);
    
    // Create a container for PDF generation
    const pdfContainer = document.createElement('div');
    pdfContainer.id = 'pdf-report-clone';
    pdfContainer.style.cssText = `
      position: absolute;
      top: -9999px;
      left: 0;
      width: 794px;
      background: white;
      color: black;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      direction: rtl;
      padding: 20px;
      box-sizing: border-box;
    `;
    
    // Clone the printable report
    const reportClone = printableReport.cloneNode(true);
    reportClone.id = 'pdf-report-content';
    
    // Add PDF-specific styles
    const style = document.createElement('style');
    style.textContent = `
      #pdf-report-clone {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        direction: rtl !important;
        color: black !important;
        background: white !important;
      }
      #pdf-report-clone .association-header {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        position: relative !important;
        margin-bottom: 20px !important;
        padding: 15px !important;
        border-bottom: 3px solid #518664 !important;
        background: white !important;
      }
      #pdf-report-clone .association-info {
        text-align: center !important;
        z-index: 1 !important;
      }
      #pdf-report-clone .association-logo {
        position: absolute !important;
        right: 15px !important;
        z-index: 2 !important;
      }
      #pdf-report-clone .report-logo {
        width: 60px !important;
        height: 60px !important;
        object-fit: contain !important;
        border-radius: 50% !important;
        border: 2px solid #518664 !important;
        padding: 3px !important;
        background: white !important;
      }
      #pdf-report-clone .association-title {
        color: #518664 !important;
        font-size: 24px !important;
        font-weight: bold !important;
        margin: 0 !important;
        white-space: nowrap !important;
      }
      #pdf-report-clone .association-subtitle {
        color: #666 !important;
        font-size: 12px !important;
        margin: 5px 0 0 0 !important;
        font-style: italic !important;
        white-space: nowrap !important;
        text-align: center !important;
      }
      #pdf-report-clone .report-title {
        text-align: center !important;
        margin-bottom: 20px !important;
        border-bottom: 2px solid #518664 !important;
        padding-bottom: 10px !important;
      }
      #pdf-report-clone .report-title h2 {
        color: #518664 !important;
        font-size: 22px !important;
        font-weight: bold !important;
        margin: 0 0 10px 0 !important;
      }
      #pdf-report-clone .report-period,
      #pdf-report-clone .report-generated {
        text-align: center !important;
        font-size: 12px !important;
        color: #666 !important;
        margin: 5px 0 !important;
      }
      #pdf-report-clone .summary-cards {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 15px !important;
        margin: 20px 0 !important;
        justify-content: space-around !important;
      }
      #pdf-report-clone .summary-card {
        border: 1px solid #518664 !important;
        border-radius: 6px !important;
        padding: 15px !important;
        background: #f8f9fa !important;
        min-width: 180px !important;
        flex: 1 !important;
        max-width: 300px !important;
      }
      #pdf-report-clone .summary-card h4 {
        color: #518664 !important;
        font-size: 16px !important;
        font-weight: bold !important;
        margin: 0 0 10px 0 !important;
        text-align: right !important;
      }
      #pdf-report-clone .summary-card p {
        margin: 6px 0 !important;
        font-size: 13px !important;
        color: #333 !important;
        text-align: right !important;
      }
      #pdf-report-clone .chart-section {
        background: white !important;
        border: 1px solid #333 !important;
        margin-bottom: 15px !important;
        padding: 15px !important;
        border-radius: 6px !important;
      }
      #pdf-report-clone .chart-container {
        height: 250px !important;
        box-shadow: none !important;
        border: 1px solid #ddd !important;
        background: white !important;
        padding: 10px !important;
      }
      #pdf-report-clone .chart-section h3 {
        color: #518664 !important;
        font-size: 18px !important;
        font-weight: bold !important;
        margin: 0 0 15px 0 !important;
        text-align: right !important;
        border-bottom: 1px solid #518664 !important;
        padding-bottom: 5px !important;
      }
      #pdf-report-clone .report-section {
        margin: 25px 0 !important;
      }
      #pdf-report-clone .report-section h3 {
        color: #518664 !important;
        font-size: 18px !important;
        font-weight: bold !important;
        margin: 0 0 15px 0 !important;
        text-align: right !important;
        border-bottom: 1px solid #518664 !important;
        padding-bottom: 5px !important;
      }
      #pdf-report-clone .report-table {
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 12px !important;
        margin-top: 10px !important;
      }
      #pdf-report-clone .report-table th {
        background-color: #518664 !important;
        color: white !important;
        padding: 10px 8px !important;
        text-align: right !important;
        font-weight: bold !important;
        border: 1px solid #518664 !important;
      }
      #pdf-report-clone .report-table td {
        padding: 8px !important;
        text-align: right !important;
        border: 1px solid #ddd !important;
        background: white !important;
      }
      #pdf-report-clone .report-table tr:nth-child(even) td {
        background-color: #f8f9fa !important;
      }
      #pdf-report-clone .no-data {
        text-align: center !important;
        padding: 30px !important;
        color: #666 !important;
        font-style: italic !important;
      }
    `;
    
    pdfContainer.appendChild(style);
    pdfContainer.appendChild(reportClone);
    document.body.appendChild(pdfContainer);
    
    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate canvas from the container
    const canvas = await html2canvas(pdfContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: pdfContainer.scrollWidth,
      height: pdfContainer.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      logging: false,
      allowTaint: false
    });
    
    // Create PDF with tight margins
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 10; // 10mm margin
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);
    
    // Calculate scale to fit content
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(contentWidth / (imgWidth * 0.264583), contentHeight / (imgHeight * 0.264583));
    
    const finalWidth = imgWidth * 0.264583 * ratio;
    const finalHeight = imgHeight * 0.264583 * ratio;
    
    // Center content on page
    const xPos = (pageWidth - finalWidth) / 2;
    const yPos = margin;
    
    // Convert canvas to image and add to PDF
    const imgData = canvas.toDataURL('image/png');
    
    // Handle multiple pages if content is too long
    if (finalHeight > contentHeight) {
      let currentY = 0;
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');
      const pageHeightPx = contentHeight / 0.264583 / ratio;
      
      pageCanvas.width = canvas.width;
      pageCanvas.height = pageHeightPx;
      
      while (currentY < imgHeight) {
        pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(canvas, 0, -currentY);
        
        const pageImgData = pageCanvas.toDataURL('image/png');
        
        if (currentY > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(pageImgData, 'PNG', xPos, yPos, finalWidth, Math.min(contentHeight, finalHeight - (currentY * 0.264583 * ratio)));
        
        currentY += pageHeightPx;
      }
    } else {
      pdf.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight);
    }
    
    // Generate filename with timestamp
    const timestamp = new Date().toLocaleDateString('he-IL').replace(/\//g, '-');
    const filename = `דו״ח-מערכת-ניהול-מלאי-${timestamp}.pdf`;
    
    // Save the PDF
    pdf.save(filename);
    
    // Cleanup
    document.body.removeChild(pdfContainer);
    document.body.removeChild(loadingOverlay);
    
    toast.success('PDF נוצר בהצלחה!');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('שגיאה ביצירת PDF');
    
    // Cleanup on error
    const loadingOverlay = document.querySelector('[style*="position: fixed"][style*="z-index: 9999"]');
    const pdfContainer = document.getElementById('pdf-report-clone');
    if (loadingOverlay) document.body.removeChild(loadingOverlay);
    if (pdfContainer) document.body.removeChild(pdfContainer);
  }
};
