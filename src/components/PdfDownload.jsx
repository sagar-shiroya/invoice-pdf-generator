import React, { useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import './PdfDownload.css';
import { PreviewIcon, DownloadIcon, CloseIcon, SpinnerIcon } from './Icons';

const PdfDownload = ({ invoiceData, onDownloadComplete }) => {
  const invoiceRef = useRef();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const downloadPDF = async () => {
    if (!invoiceRef.current || isGenerating) return;

    // Debug: Log the invoice data to console
    console.log('Invoice Data for PDF:', invoiceData);
    console.log('Invoice Rows:', invoiceData.rows);

    setIsGenerating(true);
    
    // Store original styles
    const originalOpacity = invoiceRef.current.style.opacity;
    const originalZIndex = invoiceRef.current.style.zIndex;
    const originalPosition = invoiceRef.current.style.position;
    const originalClassName = invoiceRef.current.className;
    
    try {
      // Configure PDF options for high quality output
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `Invoice_${invoiceData.invoiceNo || 'Draft'}_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 2.5,          // Higher scale for crisp text
          dpi: 300,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          removeContainer: true,
          imageTimeout: 0,
          width: 794,
          letterRendering: true,
          foreignObjectRendering: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: false,
          precision: 16
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Remove preview-mode class and temporarily make the element visible for capture
      invoiceRef.current.className = 'pdf-template';
      invoiceRef.current.style.position = 'relative';
      invoiceRef.current.style.display = 'block';
      invoiceRef.current.style.opacity = '1';
      invoiceRef.current.style.visibility = 'visible';
      invoiceRef.current.style.zIndex = '9999';
      invoiceRef.current.style.left = '0';
      invoiceRef.current.style.top = '0';
      invoiceRef.current.style.transform = 'none';
      invoiceRef.current.style.width = '794px';

      // Wait for rendering and layout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate PDF
      await html2pdf().from(invoiceRef.current).set(opt).save();
      
      // Close preview after successful download
      setShowPreview(false);
      
      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Always restore original styles
      if (invoiceRef.current) {
        invoiceRef.current.className = originalClassName;
        invoiceRef.current.style.opacity = originalOpacity;
        invoiceRef.current.style.zIndex = originalZIndex;
        invoiceRef.current.style.position = originalPosition;
        invoiceRef.current.style.width = '';
      }
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowPreview(true)}
        className="btn-primary icon-btn"
        data-tooltip="Preview Invoice"
      >
        <PreviewIcon />
      </button>
      
      <button 
        onClick={downloadPDF}
        className="btn-primary icon-btn"
        disabled={isGenerating}
        data-tooltip={isGenerating ? 'Generating...' : 'Download PDF'}
      >
        {isGenerating ? <SpinnerIcon /> : <DownloadIcon />}
      </button>

      {/* Preview overlay */}
      {showPreview && (
        <>
          <div className="pdf-preview-overlay" onClick={() => setShowPreview(false)}></div>
          <div className="pdf-preview-controls">
            <button 
              className="btn-primary icon-btn" 
              onClick={downloadPDF} 
              disabled={isGenerating}
              data-tooltip={isGenerating ? 'Generating...' : 'Download PDF'}
            >
              {isGenerating ? <SpinnerIcon /> : <DownloadIcon />}
            </button>
            <button 
              className="btn-light icon-btn" 
              onClick={() => setShowPreview(false)}
              data-tooltip="Close Preview"
            >
              <CloseIcon />
            </button>
          </div>
        </>
      )}

      {/* Hidden invoice template for PDF generation */}
      <div 
        ref={invoiceRef} 
        className={`pdf-template ${showPreview ? 'preview-mode' : ''}`}
      >
        {/* Invoice Header */}
        <table style={{ width: '100%', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          <tr>
            <td style={{ width: '60%', verticalAlign: 'top' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
                {invoiceData.companyName}
              </div>
              <div style={{ fontSize: '14px', fontStyle: 'italic', marginBottom: '8px' }}>
                {invoiceData.companySubtitle}
              </div>
              <div style={{ fontSize: '12px' }}>
                {invoiceData.companyAddress}
              </div>
            </td>
            <td style={{ width: '40%', verticalAlign: 'top', textAlign: 'right' }}>
              <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                <strong>Invoice No.:</strong> {invoiceData.invoiceNo}
                <span style={{ marginLeft: '20px' }}>
                  <strong>Date:</strong> {invoiceData.invoiceDate}
                </span>
              </div>
              <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                <strong>Challa No.:</strong> {invoiceData.challaNo}
                <span style={{ marginLeft: '20px' }}>
                  <strong>Challa Date:</strong> {invoiceData.challaDate}
                </span>
              </div>
              <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                <strong>Order No.:</strong> {invoiceData.orderNo}
                <span style={{ marginLeft: '20px' }}>
                  <strong>Order Date:</strong> {invoiceData.orderDate}
                </span>
              </div>
              <div style={{ fontSize: '13px' }}>
                <strong>Vehicle No.:</strong> {invoiceData.vehicleNo}
              </div>
            </td>
          </tr>
        </table>

        {/* Buyer Tax Details */}
        <div style={{ 
          padding: '10px', 
          border: '1px solid #000', 
          backgroundColor: '#f9f9f9', 
          marginBottom: '15px',
          fontSize: '13px'
        }}>
          <span style={{ marginRight: '30px' }}>
            <strong>Company's GSTIN:</strong> {invoiceData.buyerGSTIN}
          </span>
          <span style={{ marginRight: '30px' }}>
            <strong>PAN No.</strong> {invoiceData.buyerPAN}
          </span>
          <span>
            <strong>State</strong> {invoiceData.buyerState}
          </span>
        </div>

        {/* Buyer Details */}
        <div style={{ 
          padding: '10px', 
          border: '1px solid #000', 
          backgroundColor: '#f9f9f9', 
          marginBottom: '20px' 
        }}>
          <div style={{ fontSize: '13px', marginBottom: '5px' }}>
            <strong>Buyer Name:</strong> {invoiceData.buyerName}
          </div>
          <div style={{ fontSize: '13px', marginBottom: '5px' }}>
            <strong>Buyer Address:</strong> {invoiceData.buyerAddress}
          </div>
          <div style={{ fontSize: '13px' }}>
            <strong>Buyer's GSTIN:</strong> {invoiceData.partyGSTIN}
          </div>
        </div>

        {/* Items Table */}
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          marginBottom: '20px',
          border: '2px solid #000'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#e0e0e0' }}>
              <th style={{ border: '1px solid #000', padding: '8px', fontSize: '13px', width: '8%' }}>Sr. No.</th>
              <th style={{ border: '1px solid #000', padding: '8px', fontSize: '13px', width: '45%' }}>Description of Goods</th>
              <th style={{ border: '1px solid #000', padding: '8px', fontSize: '13px', width: '12%' }}>HSN Code</th>
              <th style={{ border: '1px solid #000', padding: '8px', fontSize: '13px', width: '10%' }}>Qty</th>
              <th style={{ border: '1px solid #000', padding: '8px', fontSize: '13px', width: '12%' }}>Rate</th>
              <th style={{ border: '1px solid #000', padding: '8px', fontSize: '13px', width: '13%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoiceData.rows && invoiceData.rows.length > 0 && invoiceData.rows[0].description) ? invoiceData.rows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '13px' }}>
                  {idx + 1}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', fontSize: '13px' }}>
                  {row.description}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', fontSize: '13px' }}>
                  {row.hsn}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '13px' }}>
                  {row.qty}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '13px' }}>
                  {row.rate}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '13px' }}>
                  {row.amount}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{ 
                  border: '1px solid #000', 
                  padding: '20px', 
                  textAlign: 'center', 
                  fontStyle: 'italic',
                  fontSize: '13px'
                }}>
                  No items added
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Amount in Words and Totals */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            padding: '10px', 
            border: '1px solid #000', 
            backgroundColor: '#f9f9f9', 
            marginBottom: '15px' 
          }}>
            <div style={{ fontSize: '13px' }}>
              <strong>Rupees in Words:</strong> <span style={{ textTransform: 'capitalize' }}>
                {invoiceData.rupeesWords}
              </span>
            </div>
          </div>

          <table style={{ width: '100%' }}>
            <tr>
              <td style={{ width: '70%', verticalAlign: 'top', paddingRight: '20px' }}>
                <div style={{ 
                  padding: '10px', 
                  border: '1px solid #000', 
                  backgroundColor: '#f9f9f9',
                  fontSize: '13px',
                  height: '100%'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Bank Name:</strong> {invoiceData.bankName}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Branch:</strong> {invoiceData.bankBranch}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>A/C. No.:</strong> {invoiceData.bankAccount}
                  </div>
                  <div>
                    <strong>IFSC:</strong> {invoiceData.bankIFSC}
                  </div>
                </div>
              </td>
              <td style={{ width: '30%', verticalAlign: 'top' }}>
                <div style={{
                  backgroundColor: '#f9f9f9',
                  height: '100%'
                }}>
                  <table style={{ width: '100%', fontSize: '13px' }}>
                    <tr>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ccc' }}>Sub Total:</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
                        {invoiceData.subTotal}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ccc' }}>
                        CGST {invoiceData.cgstPercent || 0}%:
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
                        {invoiceData.cgst}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ccc' }}>
                        SGST {invoiceData.sgstPercent || 0}%:
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
                        {invoiceData.sgst}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ccc' }}>
                        IGST {invoiceData.igstPercent || 0}%:
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
                        {invoiceData.igst}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #000' }}>Round Off:</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', borderBottom: '2px solid #000' }}>
                        {invoiceData.roundOff}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#e0e0e0' }}>
                        G. TOTAL:
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#e0e0e0' }}>
                        {invoiceData.gTotal}
                      </td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
          </table>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '2px solid #000', paddingTop: '15px' }}>
          <table style={{ width: '100%' }}>
            <tr>
              <td style={{ width: '65%', verticalAlign: 'top' }}>
                <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                  {(invoiceData.footerNotes || '').split('\n').map((line, idx) => (
                    <div key={idx} style={{ marginBottom: '3px' }}>{line}</div>
                  ))}
                </div>
              </td>
              <td style={{ width: '35%', verticalAlign: 'bottom', textAlign: 'right' }}>
                <div style={{ 
                  marginTop: '40px',
                  borderBottom: '1px solid #000',
                  paddingBottom: '5px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  {invoiceData.signature || 'Authorized Signature'}
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </>
  );
};

export default PdfDownload; 