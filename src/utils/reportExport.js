import { toast } from "react-toastify";

/**
 * Print Report Utility
 * Handles professional printing of reports with custom styling
 */
export const printReport = () => {
  // Check if report exists
  const printableReport = document.getElementById('printable-report');
  if (!printableReport) {
    toast.error('לא נמצא תוכן להדפסה');
    return;
  }

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
        padding: 5mm 8mm 15mm 8mm !important;
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
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 5mm !important;
        background: white !important;
        box-sizing: border-box !important;
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
        height: 110px !important;
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
        // position: relative !important;
        // z-index: 1 !important;
        // right: 0 !important;
      }
      
      .report-logo {
        width: 100px !important;
        height: 100px !important;
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
        padding: 15px !important;
        background: #f8f9fa !important;
        min-width: 200px !important;
        flex: 1 !important;
        // max-width: 320px !important;
        max-width: 100% !important;
      }
      
      .summary-card h4 {
        color: #518664 !important;
        font-size: 16px !important;
        font-weight: bold !important;
        margin: 0 0 12px 0 !important;
        text-align: right !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 8px !important;
        direction: rtl !important;
      }
      
      .summary-card p {
        margin: 6px 0 !important;
        font-size: 13px !important;
        color: #333 !important;
        text-align: right !important;
      }
      
      /* Chart styling for print */
      .chart-section {
        background: white !important;
        border: 1px solid #518664 !important;
        page-break-inside: avoid !important;
        margin: 0 0 20px 0 !important;
        padding: 18px !important;
        border-radius: 8px !important;
      }
      
      .chart-container {
        height: 300px !important;
        width: 100% !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
        margin: 0 !important;
        background: white !important;
      }
      
      .chart-section h3 {
        color: #518664 !important;
        border-bottom: 1px solid #518664 !important;
        font-size: 18px !important;
        font-weight: bold !important;
        margin: 0 0 10px 0 !important;
        text-align: right !important;
        padding: 0 0 5px 0 !important;
      }
      
      /* Center chart legends in print */
      .recharts-legend-wrapper {
        text-align: center !important;
        display: flex !important;
        justify-content: center !important;
        width: 100% !important;
        background: transparent !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .recharts-default-legend {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        gap: 15px !important;
        margin: 0 !important;
        padding: 0 !important;
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
      
      /* Force white background on all chart elements */
      .recharts-wrapper,
      .recharts-surface,
      svg,
      canvas {
        background: white !important;
      }
      
      /* Ensure text in charts is black */
      .recharts-text,
      .recharts-cartesian-axis-tick-value,
      .recharts-legend-item-text {
        fill: black !important;
        color: black !important;
      }
      
      /* Ensure all text content is black for print */
      .report-section h3,
      .summary-card h4,
      .summary-card p,
      .association-title,
      .association-subtitle,
      .report-title h2,
      .report-period,
      .report-generated,
      .chart-section h3,
      .no-data,
      p, h1, h2, h3, h4, h5, h6, span, div, td, th {
        color: black !important;
      }
      
      /* Table styling */
      .report-section {
        margin: 20px 0 !important;
        page-break-inside: avoid !important;
      }
      
      .report-section h3 {
        color: #518664 !important;
        font-size: 18px !important;
        font-weight: bold !important;
        margin: 0 0 15px 0 !important;
        text-align: right !important;
        border-bottom: 1px solid #518664 !important;
        padding-bottom: 5px !important;
      }
      
      .report-table {
        width: 100% !important;
        max-width: 100% !important;
        border-collapse: collapse !important;
        font-size: 10px !important;
        margin-top: 15px !important;
        table-layout: fixed !important;
        overflow: hidden !important;
        border: 1px solid #518664 !important;
        border-radius: 0px !important;
      }
      
      .report-table-container {
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .report-table th {
        background-color: #518664 !important;
        color: white !important;
        padding: 6px 4px !important;
        text-align: right !important;
        font-weight: bold !important;
        border: 1px solid #518664 !important;
        font-size: 11px !important;
        word-wrap: break-word !important;
        overflow: hidden !important;
      }
      
      .report-table td {
        padding: 5px 3px !important;
        text-align: right !important;
        border: 1px solid #ddd !important;
        background: white !important;
        color: black !important;
        font-size: 11px !important;
        word-wrap: break-word !important;
        overflow: hidden !important;
      }
      
      .report-table tr:nth-child(even) td {
        background-color: #f8f9fa !important;
        color: black !important;
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
        margin: 10mm 5mm 15mm 5mm;
        size: A4;
        @top-center {
          // content: "דו״ח מערכת ניהול מלאי";
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
  if (printableReport) {
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
