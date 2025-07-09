import React, { useState, useEffect, useRef } from 'react';
import PdfDownload from './PdfDownload';
import './Invoice.css';
import { faker } from '@faker-js/faker';
import { useToast } from '../hooks/useToast.jsx';
import { SaveIcon, LoadIcon, SampleIcon, AddIcon, RemoveIcon } from './Icons';

const defaultRow = {
  description: '',
  hsn: '',
  qty: '',
  rate: '',
  amount: '',
};

const LOCAL_STORAGE_KEY = 'invoiceTemplate';

// Helper to convert number to words (simple version for INR)
function numberToWords(num) {
  // Only works for numbers up to 9999999
  const a = [ '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen' ];
  const b = [ '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety' ];
  const g = [ '', 'thousand', 'lakh', 'crore' ];
  if (num === 0) return 'Zero';
  
  let str = '';
  let n = Math.floor(num);
  let i = 0;
  while (n > 0) {
    let rem = n % 1000;
    if (rem !== 0) {
      let s = '';
      if (rem > 99) {
        s += a[Math.floor(rem / 100)] + ' hundred ';
        rem = rem % 100;
      }
      if (rem > 19) {
        s += b[Math.floor(rem / 10)] + ' ' + a[rem % 10] + ' ';
      } else if (rem > 0) {
        s += a[rem] + ' ';
      }
      str = s + g[i] + ' ' + str;
    }
    n = Math.floor(n / 1000);
    i++;
  }
  
  // Capitalize first letter of each word
  const words = (str.trim() + ' rupees only').split(' ');
  const capitalizedWords = words.map(word => {
    if (word.length > 0) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  });
  
  return capitalizedWords.join(' ');
}

const generateSampleRow = () => {
  const qty = faker.number.int({ min: 1, max: 10 });
  const rate = faker.commerce.price({ min: 100, max: 2000, dec: 2 });
  return {
    description: faker.commerce.productName(),
    hsn: faker.number.int({ min: 100000, max: 999999 }).toString(),
    qty: qty.toString(),
    rate: rate.toString(),
    amount: (qty * rate).toFixed(2),
  };
};

const Invoice = () => {
  // State for all editable fields
  const [companyName, setCompanyName] = useState('');
  const [companySubtitle, setCompanySubtitle] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerGSTIN, setBuyerGSTIN] = useState('');
  const [buyerPAN, setBuyerPAN] = useState('');
  const [buyerState, setBuyerState] = useState('');
  const [partyGSTIN, setPartyGSTIN] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [challaNo, setChallaNo] = useState('');
  const [challaDate, setChallaDate] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [rows, setRows] = useState([{ ...defaultRow }]);
  const [rupeesWords, setRupeesWords] = useState('');
  const [subTotal, setSubTotal] = useState('');
  const [cgst, setCgst] = useState('');
  const [sgst, setSgst] = useState('');
  const [igst, setIgst] = useState('');
  const [cgstPercent, setCgstPercent] = useState('');
  const [sgstPercent, setSgstPercent] = useState('');
  const [igstPercent, setIgstPercent] = useState('');
  const [roundOff, setRoundOff] = useState('');
  const [gTotal, setGTotal] = useState('');
  const [signature, setSignature] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIFSC, setBankIFSC] = useState('');
  const [footerNotes, setFooterNotes] = useState('');
  const [showWords, setShowWords] = useState(false);

  const invoiceRef = useRef();
  const { addToast } = useToast();

  // Dynamically update document title
  useEffect(() => {
    if (invoiceNo) {
      document.title = `Invoice #${invoiceNo}`;
    } else {
      document.title = 'Invoice Generator';
    }
  }, [invoiceNo]);

  // Prepare invoice data for PDF generation
  const prepareInvoiceData = () => {
    return {
      companyName,
      companySubtitle,
      companyAddress,
      buyerName,
      buyerAddress,
      buyerGSTIN,
      buyerPAN,
      buyerState,
      partyGSTIN,
      invoiceNo,
      invoiceDate,
      challaNo,
      challaDate,
      orderNo,
      orderDate,
      vehicleNo,
      rows,
      rupeesWords,
      subTotal,
      cgst,
      sgst,
      igst,
      cgstPercent,
      sgstPercent,
      igstPercent,
      roundOff,
      gTotal,
      signature,
      bankName,
      bankBranch,
      bankAccount,
      bankIFSC,
      footerNotes
    };
  };

  const handlePdfDownloadComplete = () => {
    addToast('PDF downloaded successfully!', 'success');
  };

  // Handlers for dynamic rows
  const handleRowChange = (idx, field, value) => {
    const updatedRows = rows.map((row, i) => {
      if (i === idx) {
        const updated = { ...row, [field]: value };
        // Auto-calculate amount if qty and rate are present
        if ((field === 'qty' || field === 'rate')) {
          const qty = parseFloat(field === 'qty' ? value : row.qty) || 0;
          const rate = parseFloat(field === 'rate' ? value : row.rate) || 0;
          updated.amount = qty && rate ? (qty * rate).toFixed(2) : '';
        }
        return updated;
      }
      return row;
    });
    setRows(updatedRows);
  };

  const addRow = () => setRows([...rows, { ...defaultRow }]);
  const removeRow = (idx) => setRows(rows.filter((_, i) => i !== idx));

  // Template management
  const saveTemplate = () => {
    const template = {
      companyName,
      companySubtitle,
      companyAddress,
      buyerGSTIN,
      buyerPAN,
      buyerState,
      bankName,
      bankBranch,
      bankAccount,
      bankIFSC,
      footerNotes,
      signature,
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(template));
      addToast('Template saved successfully!', 'success');
    } catch {
      addToast('Failed to save template.', 'error');
    }
  };

  const loadTemplate = () => {
    try {
      const templateStr = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!templateStr) {
        addToast('No template found.', 'info');
        return;
      }
      const template = JSON.parse(templateStr);
      setCompanyName(template.companyName || '');
      setCompanySubtitle(template.companySubtitle || '');
      setCompanyAddress(template.companyAddress || '');
      setBuyerGSTIN(template.buyerGSTIN || '');
      setBuyerPAN(template.buyerPAN || '');
      setBuyerState(template.buyerState || '');
      setPartyGSTIN(template.partyGSTIN || '');
      setBankName(template.bankName || '');
      setBankBranch(template.bankBranch || '');
      setBankAccount(template.bankAccount || '');
      setBankIFSC(template.bankIFSC || '');
      setFooterNotes(template.footerNotes || '');
      setSignature(template.signature || '');
      addToast('Template loaded successfully!', 'success');
    } catch {
      addToast('Failed to load template.', 'error');
    }
  };

  // Auto-calculate subtotal, taxes, round off, grand total, and amount in words
  useEffect(() => {
    // Subtotal
    const subtotal = rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    setSubTotal(subtotal.toFixed(2));
    // CGST, SGST, IGST
    const cgstVal = subtotal * (parseFloat(cgstPercent) || 0) / 100;
    const sgstVal = subtotal * (parseFloat(sgstPercent) || 0) / 100;
    const igstVal = subtotal * (parseFloat(igstPercent) || 0) / 100;
    setCgst(cgstVal.toFixed(2));
    setSgst(sgstVal.toFixed(2));
    setIgst(igstVal.toFixed(2));
    // Grand total before round off
    const totalBeforeRound = subtotal + cgstVal + sgstVal + igstVal;
    // Round off
    const rounded = Math.round(totalBeforeRound);
    const roundOffVal = (rounded - totalBeforeRound).toFixed(2);
    setRoundOff(roundOffVal);
    // Grand total
    setGTotal((rounded).toFixed(2));
    // Amount in words
    setRupeesWords(numberToWords(rounded));
  }, [rows, cgstPercent, sgstPercent, igstPercent]);

  // Sample data for testing
  const fillSampleData = () => {
    setCompanyName(faker.company.name());
    setCompanySubtitle(faker.company.catchPhrase());
    setCompanyAddress(`${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()} ${faker.location.zipCode()}`);
    setBuyerName(faker.person.fullName());
    setBuyerAddress(`${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()} ${faker.location.zipCode()}`);
    setBuyerGSTIN(faker.string.alphanumeric(15).toUpperCase());
    setPartyGSTIN(faker.string.alphanumeric(15).toUpperCase());
    setBuyerPAN(faker.string.alphanumeric(10).toUpperCase());
    setBuyerState(faker.location.state());
    setInvoiceNo(faker.number.int({ min: 1000, max: 9999 }).toString());
    setInvoiceDate(faker.date.past().toISOString().slice(0, 10));
    setChallaNo(faker.number.int({ min: 100, max: 999 }).toString());
    setChallaDate(faker.date.past().toISOString().slice(0, 10));
    setOrderNo(faker.number.int({ min: 500, max: 1500 }).toString());
    setOrderDate(faker.date.past().toISOString().slice(0, 10));
    setVehicleNo(faker.vehicle.vrm());
    setRows(Array.from({ length: 3 }, generateSampleRow));
    setCgstPercent(faker.number.int({ min: 5, max: 18 }));
    setSgstPercent(faker.number.int({ min: 5, max: 18 }));
    setIgstPercent(0);
    setBankName(faker.finance.accountName() + ' Bank');
    setBankBranch(faker.location.city());
    setBankAccount(faker.finance.accountNumber());
    setBankIFSC(faker.finance.bic());
    setFooterNotes(faker.lorem.sentences(3));
    setSignature(faker.person.fullName());
    addToast('Sample data filled!', 'info');
  };





  return (
    <div className="app-container">
      <div className="actions-sidebar">
        <button type="button" className="btn-primary icon-btn" onClick={saveTemplate} data-tooltip="Save Template">
          <SaveIcon />
        </button>
        <button type="button" className="btn-primary icon-btn" onClick={loadTemplate} data-tooltip="Load Template">
          <LoadIcon />
        </button>
        <button type="button" className="btn-primary icon-btn" onClick={fillSampleData} data-tooltip="Fill Sample Data">
          <SampleIcon />
        </button>
        <PdfDownload 
          invoiceData={prepareInvoiceData()} 
          onDownloadComplete={handlePdfDownloadComplete}
        />
      </div>
      
      <div className="invoice-form-container">
        <div ref={invoiceRef} className="invoice-container">
          <div className="invoice-header">
            <div className="invoice-title">
              <input className="input-company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Enter Company Name" />
              <div className="invoice-subtitle">
                <input className="input-company-subtitle" value={companySubtitle} onChange={e => setCompanySubtitle(e.target.value)} placeholder="Enter Company Details" />
              </div>
              <div className="invoice-address">
                <input className="input-company-address" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="Enter Company Address" />
              </div>
            </div>
            <div className="invoice-meta">
              <div className="meta-row">
                <div>Invoice No.: <input className="input-short" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} /></div>
                <div>Date: <input className="input-short" type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></div>
              </div>
              <div className="meta-row">
                <div>Challa No.: <input className="input-short" value={challaNo} onChange={e => setChallaNo(e.target.value)} /></div>
                <div>Date: <input className="input-short" value={challaDate} onChange={e => setChallaDate(e.target.value)} /></div>
              </div>
              <div className="meta-row">
                <div>Order No.: <input className="input-short" value={orderNo} onChange={e => setOrderNo(e.target.value)} /></div>
                <div>Date: <input className="input-short" value={orderDate} onChange={e => setOrderDate(e.target.value)} /></div>
              </div>
              <div className="meta-row">
                <div>Vehicle No.: <input className="input-short" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} /></div>
              </div>
            </div>
          </div>
          <div className="invoice-ids">
            <div>Company GSTIN: <input className="input-medium" value={buyerGSTIN} onChange={e => setBuyerGSTIN(e.target.value)} /></div>
            <div>PAN No.: <input className="input-medium" value={buyerPAN} onChange={e => setBuyerPAN(e.target.value)} /></div>
            <div>State: <input className="input-short" value={buyerState} onChange={e => setBuyerState(e.target.value)} /></div>
          </div>
          <div className="invoice-party">
            <div>
              Buyer Name & Address:
              <input className="input-long" placeholder="Party Name" value={buyerName} onChange={e => setBuyerName(e.target.value)} />
              <input className="input-long" placeholder="Address" value={buyerAddress} onChange={e => setBuyerAddress(e.target.value)} />
            </div>
            <div>
              Buyer's GSTIN No.: <input className="input-medium" value={partyGSTIN} onChange={e => setPartyGSTIN(e.target.value)} placeholder="Enter Buyer's GSTIN" />
            </div>
          </div>
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Description of Goods</th>
                <th>HSN Code</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="sr-no-cell">{idx + 1}</td>
                  <td><input className="input-table-long" value={row.description} onChange={e => handleRowChange(idx, 'description', e.target.value)} /></td>
                  <td><input className="input-short" value={row.hsn} onChange={e => handleRowChange(idx, 'hsn', e.target.value)} /></td>
                  <td><input className="input-short" value={row.qty} onChange={e => handleRowChange(idx, 'qty', e.target.value)} /></td>
                  <td><input className="input-short" value={row.rate} onChange={e => handleRowChange(idx, 'rate', e.target.value)} /></td>
                  <td><input className="input-short" value={row.amount} onChange={e => handleRowChange(idx, 'amount', e.target.value)} /></td>
                  <td>
                    <button type="button" className="table-action-btn" onClick={() => removeRow(idx)} disabled={rows.length === 1} data-tooltip="Remove Row">
                      <RemoveIcon />
                    </button>
                    {idx === rows.length - 1 && (
                      <button type="button" className="table-action-btn" onClick={addRow} data-tooltip="Add Row">
                        <AddIcon />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="invoice-amounts">
            <div className="amount-row">
              <span>Rupees in Words:</span>
              <input className="input-words" value={rupeesWords} readOnly onFocus={() => setShowWords(true)} onBlur={() => setShowWords(false)} />
              {showWords && (
                <div className="words-popup">{rupeesWords}</div>
              )}
            </div>
            <div className="amount-table">
              <div>Sub Total <input className="input-short" value={subTotal} readOnly /></div>
              <div>CGST % <input className="input-very-short" type="number" value={cgstPercent} onChange={e => setCgstPercent(e.target.value)} /> <span>Amount</span> <input className="input-short" value={cgst} readOnly /></div>
              <div>SGST % <input className="input-very-short" type="number" value={sgstPercent} onChange={e => setSgstPercent(e.target.value)} /> <span>Amount</span> <input className="input-short" value={sgst} readOnly /></div>
              <div>IGST % <input className="input-very-short" type="number" value={igstPercent} onChange={e => setIgstPercent(e.target.value)} /> <span>Amount</span> <input className="input-short" value={igst} readOnly /></div>
              <div>Round Off. <input className="input-short" value={roundOff} readOnly /></div>
              <div>G. TOTAL <input className="input-short" value={gTotal} readOnly /></div>
            </div>
          </div>
          <div className="invoice-bank-details">
            <div>Bank Name <input className="input-medium" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name" /></div>
            <div>Branch <input className="input-medium" value={bankBranch} onChange={e => setBankBranch(e.target.value)} placeholder="Bank Branch" /></div>
            <div>A/C. No. <input className="input-medium" value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="Bank Account No." /></div>
            <div>IFSC <input className="input-medium" value={bankIFSC} onChange={e => setBankIFSC(e.target.value)} placeholder="Bank IFSC Code" /></div>
          </div>
          <div className="invoice-footer left-align">
            <textarea className="footer-notes-textarea" value={footerNotes} onChange={e => setFooterNotes(e.target.value)} rows={6} placeholder="Enter footer notes here (e.g., terms and conditions)." />
            <div className="invoice-signature">
              <div className="signature-line"><input className="input-signature" placeholder="Signature" value={signature} onChange={e => setSignature(e.target.value)} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Invoice;