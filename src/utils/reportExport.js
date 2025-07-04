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
        padding: 10mm 15mm 15mm 15mm !important;
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
        margin: 0 0 15px 0 !important;
        padding: 10px 15px !important;
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
        margin-bottom: 20px !important;
        padding: 10px !important;
        border-radius: 8px !important;
      }
      
      .chart-container {
        height: 400px !important;
        width: 100% !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
        margin: 0 !important;
      }
      
      .chart-section h3 {
        color: #333 !important;
        border-bottom: 1px solid #333 !important;
        font-size: 18px !important;
        font-weight: bold !important;
        margin: 0 0 10px 0 !important;
        text-align: center !important;
        padding: 0 !important;
      }
      
      /* Center chart legends in print */
      .recharts-legend-wrapper {
        text-align: center !important;
        display: flex !important;
        justify-content: center !important;
        width: 100% !important;
      }
      
      .recharts-default-legend {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        gap: 15px !important;
      }
      
      .recharts-legend-item {
        display: flex !important;
        align-items: center !important;
        margin: 0 10px !important;
      }
      
      .recharts-legend-item-text {
        font-size: 12px !important;
        font-weight: 500 !important;
        margin-right: 8px !important;
      }
      
      /* Improve chart text readability */
      .recharts-cartesian-axis-tick-value {
        font-size: 11px !important;
        font-weight: 400 !important;
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
      
      /* Hide sorting icons in print */
      .sortable-header svg,
      .sortable-header .sort-icon,
      th svg,
      th .fa-sort,
      th .fa-sort-up,
      th .fa-sort-down,
      th [data-icon*="sort"],
      .sort-indicator {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* Reset cursor for table headers in print */
      .sortable-header,
      th {
        cursor: default !important;
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
      width: 750px;
      max-width: 750px;
      background: white;
      color: black;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      direction: rtl;
      padding: 10px 20px 20px 20px;
      box-sizing: border-box;
      font-size: 14px;
      line-height: 1.4;
    `;
    
    // Clone the printable report
    const reportClone = printableReport.cloneNode(true);
    reportClone.id = 'pdf-report-content';
    
    // Force remove any dark mode classes and attributes
    const removeThemeClasses = (element) => {
      if (element.classList) {
        element.classList.remove('dark', 'dark-mode', 'theme-dark', 'bg-dark', 'text-light');
        element.classList.add('light-mode', 'bg-white', 'text-dark');
      }
      if (element.hasAttribute) {
        element.removeAttribute('data-theme');
        element.removeAttribute('data-bs-theme');
      }
      // Process all child elements
      if (element.children) {
        Array.from(element.children).forEach(removeThemeClasses);
      }
    };
    
    removeThemeClasses(reportClone);
    
    // Add PDF-specific styles
    const style = document.createElement('style');
    style.textContent = `
      #pdf-report-clone {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        direction: rtl !important;
        color: black !important;
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      #pdf-report-clone *,
      #pdf-report-clone *::before,
      #pdf-report-clone *::after {
        background: white !important;
        color: black !important;
        border-color: #333 !important;
      }
      #pdf-report-clone .association-header {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        position: relative !important;
        margin: 0 0 16px 0 !important;
        padding: 15px 20px !important;
        border-bottom: 3px solid #518664 !important;
        background: white !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
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
        width: 80px !important;
        height: 80px !important;
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
        // margin: 5px 0 0 0 !important;
        font-style: italic !important;
        white-space: nowrap !important;
        text-align: center !important;
      }
      #pdf-report-clone .report-title {
        text-align: center !important;
        margin: 0 0 10px 0 !important;
        border-bottom: 2px solid #518664 !important;
        padding-bottom: 15px !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
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
      #pdf-report-clone .report-summary {
        margin: 0 !important;
        margin-bottom: 16px !important;
      }
      #pdf-report-clone .summary-cards {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 15px !important;
        margin-bottom: 10px !important;
        justify-content: space-around !important;
        page-break-inside: avoid !important;
      }
      #pdf-report-clone .summary-card {
        border: 1px solid #518664 !important;
        border-radius: 8px !important;
        padding: 18px !important;
        background: #f8f9fa !important;
        min-width: 200px !important;
        flex: 1 !important;
        // max-width: 320px !important;
        width: 100% !important;
        color: black !important;
        page-break-inside: avoid !important;
      }
      #pdf-report-clone .summary-card h4 {
        color: #518664 !important;
        font-size: 16px !important;
        font-weight: bold !important;
        margin: 0 0 15px 0 !important;
        text-align: right !important;
        background: transparent !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 8px !important;
        direction: rtl !important;
      }
      #pdf-report-clone .summary-card p {
        margin: 6px 0 !important;
        font-size: 13px !important;
        color: #333 !important;
        text-align: right !important;
        background: transparent !important;
      }
      #pdf-report-clone .chart-section {
        background: white !important;
        border: 1px solid #518664 !important;
        margin: 0 !important;
        margin-bottom: 20px !important;
        padding: 18px !important;
        border-radius: 8px !important;
        color: black !important;
        page-break-inside: avoid !important;
      }
      #pdf-report-clone .chart-section h3 {
        color: #518664 !important;
        font-size: 16px !important;
        font-weight: bold !important;
        margin: 0 0 10px 0 !important;
        text-align: right !important;
        // border-bottom: 1px solid #518664 !important;
        border: none !important;
        padding: 0 0 5px 0 !important;
        background: transparent !important;
      }
      #pdf-report-clone .chart-container {
        // height: 400px !important;
        width: 100% !important;
        box-shadow: none !important;
        border: none !important;
        background: white !important;
        padding: 0 !important;
        color: black !important;
        border-radius: 0 !important;
        margin: 0 !important;
      }
      #pdf-report-clone .report-section {
        margin: 0px !important;
        margin-bottom: 10px !important;
        background: white !important;
        color: black !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      #pdf-report-clone .report-section h3 {
        color: #518664 !important;
        font-size: 18px !important;
        font-weight: bold !important;
        margin: 0 !important;
        text-align: right !important;
        border-bottom: 1px solid #518664 !important;
        padding-bottom: 5px !important;
        background: transparent !important;
      }
      #pdf-report-clone .report-table {
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 13px !important;
        margin-top: 15px !important;
        background: white !important;
        color: black !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      #pdf-report-clone .report-table thead {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      #pdf-report-clone .report-table tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
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
        color: black !important;
      }
      #pdf-report-clone .report-table tr:nth-child(even) td {
        background-color: #f8f9fa !important;
        color: black !important;
      }
      /* Hide sorting icons in PDF */
      #pdf-report-clone .sortable-header svg,
      #pdf-report-clone .sortable-header .sort-icon,
      #pdf-report-clone th svg,
      #pdf-report-clone th .fa-sort,
      #pdf-report-clone th .fa-sort-up,
      #pdf-report-clone th .fa-sort-down,
      #pdf-report-clone th [data-icon*="sort"],
      #pdf-report-clone .sort-indicator {
        display: none !important;
        visibility: hidden !important;
      }
      /* Reset cursor for table headers in PDF */
      #pdf-report-clone .sortable-header,
      #pdf-report-clone th {
        cursor: default !important;
      }
      #pdf-report-clone .no-data {
        text-align: center !important;
        padding: 30px !important;
        color: #666 !important;
        font-style: italic !important;
        background: white !important;
      }
      /* Force white background on all chart elements */
      #pdf-report-clone .recharts-wrapper,
      #pdf-report-clone .recharts-surface,
      #pdf-report-clone svg,
      #pdf-report-clone canvas {
        background: white !important;
      }
      /* Ensure text in charts is black */
      #pdf-report-clone .recharts-text,
      #pdf-report-clone .recharts-cartesian-axis-tick-value,
      #pdf-report-clone .recharts-legend-item-text {
        fill: black !important;
        color: black !important;
      }
      /* Center chart legends */
      #pdf-report-clone .recharts-legend-wrapper {
        text-align: center !important;
        display: flex !important;
        justify-content: center !important;
        width: 100% !important;
        background: transparent !important;
      }
      #pdf-report-clone .recharts-default-legend {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        gap: 15px !important;
      }
      #pdf-report-clone .recharts-legend-item {
        display: flex !important;
        align-items: center !important;
        margin: 0 10px !important;
      }
      #pdf-report-clone .recharts-legend-item-text {
        font-size: 12px !important;
        font-weight: 500 !important;
        margin-right: 8px !important;
      }
      /* Increase chart font sizes for better readability */
      #pdf-report-clone .recharts-cartesian-axis-tick-value {
        font-size: 11px !important;
        font-weight: 400 !important;
      }
      #pdf-report-clone .recharts-tooltip-wrapper {
        font-size: 12px !important;
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
      allowTaint: false,
      foreignObjectRendering: false,
      ignoreElements: (element) => {
        // Skip elements that might cause dark mode issues
        return element.classList?.contains('dark-mode') || 
               element.classList?.contains('theme-dark') ||
               element.hasAttribute('data-theme');
      }
    });
    
    // Create PDF with proper multi-page handling
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const topMargin = 8; // Reduced top margin to move content up
    const sideMargin = 15; // Keep side margins normal
    const bottomMargin = 15; // Keep bottom margin normal
    const contentWidth = pageWidth - (sideMargin);
    const contentHeight = pageHeight - topMargin - bottomMargin;
    
    // Calculate dimensions without aggressive scaling
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Convert to mm (1 pixel = 0.264583 mm at 96 DPI)
    const imgWidthMM = imgWidth * 0.264583;
    const imgHeightMM = imgHeight * 0.264583;
    
    // Calculate scale only for width if needed, maintain aspect ratio
    let scale = 1;
    if (imgWidthMM > contentWidth) {
      scale = contentWidth / imgWidthMM;
    }
    
    const finalWidth = imgWidthMM * scale;
    const finalHeight = imgHeightMM * scale;
    
    // Center content horizontally
    const xPos = (pageWidth - finalWidth) / 2;
    
    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Handle multiple pages properly
    if (finalHeight > contentHeight) {
      let currentYOffset = 0;
      let pageNumber = 0;
      
      // Calculate how much content fits per page in pixels
      const contentHeightPx = contentHeight / scale / 0.264583;
      
      while (currentYOffset < imgHeight) {
        if (pageNumber > 0) {
          pdf.addPage();
        }
        
        // Create a canvas for this page
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        
        // Calculate remaining height for this page
        const remainingHeight = Math.min(contentHeightPx, imgHeight - currentYOffset);
        
        pageCanvas.width = imgWidth;
        pageCanvas.height = remainingHeight;
        
        // Fill with white background
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        
        // Draw the portion of the original canvas for this page
        pageCtx.drawImage(
          canvas,
          0, currentYOffset, imgWidth, remainingHeight,
          0, 0, imgWidth, remainingHeight
        );
        
        // Convert this page to image and add to PDF
        const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
        const pageHeightMM = remainingHeight * 0.264583 * scale;
        
        pdf.addImage(pageImgData, 'PNG', xPos, topMargin, finalWidth, pageHeightMM);
        
        // Add page number at bottom
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(` ${pageNumber + 1}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        
        currentYOffset += contentHeightPx;
        pageNumber++;
      }
    } else {
      // Content fits on one page
      pdf.addImage(imgData, 'PNG', xPos, topMargin, finalWidth, finalHeight);
      
      // Add page number
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`1`, pageWidth / 2, pageHeight - 5, { align: 'center' });
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
