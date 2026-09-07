import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { InvoiceDocument } from './InvoiceDocument';

export const generateInvoicePDF = async (invoice) => {
  if (!invoice) return;

  try {
    const documentElement = React.createElement(InvoiceDocument, { invoice });
    const blob = await pdf(documentElement).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `فاتورة_${invoice.invoice_ref || 'Embabi'}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("Error generating PDF via react-pdf:", error);
  }
};