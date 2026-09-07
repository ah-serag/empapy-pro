import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer';
import { toast } from 'sonner';

Font.register({
  family: 'Tajawal',
  fonts: [
    {
      src: `${typeof window !== 'undefined' ? window.location.origin : ''}/fonts/Tajawal-Regular.ttf`,
      fontWeight: 'normal',
    },
    {
      src: `${typeof window !== 'undefined' ? window.location.origin : ''}/fonts/Tajawal-Bold.ttf`,
      fontWeight: 'bold',
    },
  ],
});

const COLORS = {
  primary: '#173E54',
  orange: '#E8702A',
  text: '#1F2937',
  secondary: '#64748B',
  muted: '#94A3B8',
  border: '#D9E1E7',
  light: '#F7F9FA',
  white: '#FFFFFF',
  success: '#15803D',
  warning: '#B45309',
  danger: '#B91C1C',
};

const styles = StyleSheet.create({
  page: {
    position: 'relative',
    paddingTop: 42,
    paddingBottom: 68,
    paddingHorizontal: 38,
    backgroundColor: COLORS.white,
    fontFamily: 'Tajawal',
    color: COLORS.text,
    fontSize: 9,
  },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 7, flexDirection: 'row' },
  topBarBlue: { flex: 1, backgroundColor: COLORS.primary },
  topBarOrange: { width: 105, backgroundColor: COLORS.orange },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 7, flexDirection: 'row-reverse' },

  header: {
    position: 'relative',
    height: 120,
    marginTop: 7,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1.2,
    borderBottomColor: COLORS.primary,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  companyBlock: { width: '45%', alignItems: 'flex-end' },
  logoWrapper: { marginBottom: 16, alignItems: 'center', alignSelf: 'flex-end' },
  logoEnglishRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoEM: { fontSize: 32, lineHeight: 1, fontWeight: 'bold', color: COLORS.orange },
  logoPAPY: { fontSize: 32, lineHeight: 1, fontWeight: 'bold', color: COLORS.primary },
  logoArabic: { fontSize: 22, lineHeight: 1, fontWeight: 'bold', color: COLORS.orange, marginTop: 4, letterSpacing: 1 },
  companyInfo: { marginTop: 5, fontSize: 7.2, color: COLORS.secondary, textAlign: 'right', lineHeight: 1.35 },

  invoiceMetaBlock: { width: '45%', alignItems: 'flex-end' },
  invoiceTitleWrapper: { marginBottom: 16, alignItems: 'flex-end', width: '100%' },
  invoiceTitle: { fontSize: 22, lineHeight: 1.2, fontWeight: 'bold', color: COLORS.primary, textAlign: 'right' },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', width: '100%', minHeight: 18, marginBottom: 2 },
  metaLabel: { width: 60, fontSize: 8, color: COLORS.secondary, textAlign: 'right' },
  metaValue: { flex: 1, paddingRight: 6, fontSize: 8.5, fontWeight: 'bold', color: COLORS.text, textAlign: 'right' },

  informationGrid: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%', marginBottom: 18 },
  informationBox: { width: '48.5%', padding: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 5, backgroundColor: COLORS.white },
  informationBoxHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, marginBottom: 7, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  informationBoxTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary, textAlign: 'right' },
  informationRows: { width: '100%' },
  informationRow: { flexDirection: 'row-reverse', alignItems: 'center', width: '100%', minHeight: 18, marginBottom: 2 },
  informationLabel: { width: 65, fontSize: 8, color: COLORS.secondary, textAlign: 'right' },
  informationValue: { flex: 1, paddingRight: 8, fontSize: 8.5, fontWeight: 'bold', color: COLORS.text, textAlign: 'right' },

  tableSection: { marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8 },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  sectionTitle: { marginHorizontal: 9, fontSize: 10, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center' },

  table: { width: '100%', borderWidth: 1, borderColor: COLORS.border, borderRadius: 5, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row-reverse', alignItems: 'center', minHeight: 30, backgroundColor: COLORS.primary },
  tableRow: { flexDirection: 'row-reverse', alignItems: 'center', minHeight: 30, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.white },
  tableRowAlternate: { backgroundColor: COLORS.light },
  tableRowLast: { borderBottomWidth: 0 },
  numberColumn: { width: '8%', textAlign: 'center' },
  descriptionColumn: { width: '38%', textAlign: 'right' },
  skuColumn: { width: '15%', textAlign: 'center' },
  quantityColumn: { width: '10%', textAlign: 'center' },
  priceColumn: { width: '14%', textAlign: 'center' },
  totalColumn: { width: '15%', textAlign: 'center' },

  payDateCol: { width: '25%', textAlign: 'right' },
  paySafeCol: { width: '35%', textAlign: 'center' },
  payUserCol: { width: '25%', textAlign: 'center' },
  payAmountCol: { width: '15%', textAlign: 'center' },

  tableHeaderText: { paddingHorizontal: 5, fontSize: 8, fontWeight: 'bold', color: COLORS.white },
  tableCellText: { paddingHorizontal: 5, fontSize: 8.5, color: COLORS.text },
  tableCellBold: { fontWeight: 'bold', color: COLORS.primary },

  summaryWrapper: { width: '100%', marginTop: 4, marginBottom: 15 },
  summaryBox: { width: '100%', borderWidth: 1, borderColor: COLORS.border, borderRadius: 5, overflow: 'hidden' },
  summaryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', minHeight: 29, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  summaryLabel: { fontSize: 8.5, color: COLORS.secondary, textAlign: 'right' },
  summaryValue: { fontSize: 8.5, fontWeight: 'bold', color: COLORS.text, textAlign: 'left' },
  totalRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', minHeight: 40, paddingHorizontal: 12, backgroundColor: COLORS.primary },
  totalLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.white, textAlign: 'right' },
  totalValue: { fontSize: 13, fontWeight: 'bold', color: COLORS.white, textAlign: 'left' },
  remainingRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', minHeight: 31, paddingHorizontal: 12, backgroundColor: '#FFF7F1', borderBottomWidth: 0 },
  remainingLabel: { fontSize: 9, fontWeight: 'bold', color: COLORS.orange, textAlign: 'right' },
  remainingValue: { fontSize: 9.5, fontWeight: 'bold', color: COLORS.orange, textAlign: 'left' },

  footer: { position: 'absolute', left: 38, right: 38, bottom: 24, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.orange, alignItems: 'center' },
  footerCompany: { fontSize: 8.5, fontWeight: 'bold', color: COLORS.primary, marginBottom: 2 },
  footerContact: { fontSize: 7, color: COLORS.secondary, textAlign: 'center' },
  pageNumber: { position: 'absolute', left: 38, bottom: 11, fontSize: 6.5, color: COLORS.muted },
});

const formatMoney = (val: any) => Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (val: any) => val ? new Date(val).toLocaleDateString('en-GB') : '-';

const PurchaseInvoicePDFDocument = ({ invoice }: { invoice: any }) => (
  <Document title={`Purchase_Invoice_${invoice?.invoice_ref || ''}`} author="EMPABY">
    <Page size="A4" style={styles.page}>
      <View style={styles.topBar} fixed>
        <View style={styles.topBarBlue} />
        <View style={styles.topBarOrange} />
      </View>
      <View style={styles.bottomBar} fixed>
        <View style={styles.topBarOrange} />
        <View style={styles.topBarBlue} />
      </View>

      <View style={styles.header}>
        <View style={styles.companyBlock}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoEnglishRow}>
              <Text style={styles.logoEM}>EM</Text>
              <Text style={styles.logoPAPY}>PAPY</Text>
            </View>
            <Text style={styles.logoArabic}>إمبـابـي</Text>
          </View>
          <Text style={styles.companyInfo}>محمد إمبابي - لإدارة التبريد والتكييف</Text>
          <Text style={styles.companyInfo}>دمياط - مصر | 01021217797</Text>
        </View>

        <View style={styles.invoiceMetaBlock}>
          <View style={styles.invoiceTitleWrapper}>
            <Text style={styles.invoiceTitle}>فاتورة مشتريات</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>رقم الفاتورة</Text>
            <Text style={styles.metaValue}>{invoice.invoice_ref}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>التاريخ</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.invoice_date)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>بواسطة</Text>
            <Text style={styles.metaValue}>{invoice.created_by_name || '-'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.informationGrid}>
        <View style={styles.informationBox}>
          <View style={styles.informationBoxHeader}>
            <Text style={styles.informationBoxTitle}>بيانات المورد</Text>
          </View>
          <View style={styles.informationRows}>
            <View style={styles.informationRow}><Text style={styles.informationLabel}>المورد</Text><Text style={styles.informationValue}>{invoice.supplier_name}</Text></View>
            <View style={styles.informationRow}><Text style={styles.informationLabel}>الشركة</Text><Text style={styles.informationValue}>{invoice.supplier_company || '-'}</Text></View>
            <View style={styles.informationRow}><Text style={styles.informationLabel}>الرقم الورقي</Text><Text style={styles.informationValue}>{invoice.supplier_invoice_number || '-'}</Text></View>
          </View>
        </View>

        <View style={styles.informationBox}>
          <View style={styles.informationBoxHeader}>
            <Text style={styles.informationBoxTitle}>ملاحظات الفاتورة</Text>
          </View>
          <View style={styles.informationRows}>
            <Text style={{ fontSize: 8.5, color: COLORS.text, textAlign: 'right', lineHeight: 1.4 }}>
              {invoice.notes || 'لا توجد ملاحظات مرفقة.'}
            </Text>
          </View>
        </View>
      </View>

      {invoice.items?.length > 0 && (
        <View style={styles.tableSection}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionTitle}>أصناف الفاتورة (الخامات)</Text>
            <View style={styles.sectionLine} />
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader} fixed>
              <Text style={[styles.tableHeaderText, styles.numberColumn]}>م</Text>
              <Text style={[styles.tableHeaderText, styles.descriptionColumn]}>اسم الصنف</Text>
              <Text style={[styles.tableHeaderText, styles.skuColumn]}>SKU</Text>
              <Text style={[styles.tableHeaderText, styles.quantityColumn]}>الكمية</Text>
              <Text style={[styles.tableHeaderText, styles.priceColumn]}>السعر</Text>
              <Text style={[styles.tableHeaderText, styles.totalColumn]}>الإجمالي</Text>
            </View>
            {invoice.items.map((item: any, index: number) => (
              <View key={index} wrap={false} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlternate : {}]}>
                <Text style={[styles.tableCellText, styles.numberColumn]}>{index + 1}</Text>
                <Text style={[styles.tableCellText, styles.descriptionColumn, { fontWeight: 'bold' }]}>{item.material_name}</Text>
                <Text style={[styles.tableCellText, styles.skuColumn]}>{item.material_sku || '-'}</Text>
                <Text style={[styles.tableCellText, styles.quantityColumn]}>{item.quantity}</Text>
                <Text style={[styles.tableCellText, styles.priceColumn]}>{formatMoney(item.unit_price)}</Text>
                <Text style={[styles.tableCellText, styles.totalColumn, styles.tableCellBold]}>{formatMoney(item.total_price)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {invoice.payments?.length > 0 && (
        <View style={styles.tableSection} wrap={false}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionTitle}>سجل الدفعات</Text>
            <View style={styles.sectionLine} />
          </View>
          <View style={styles.table}>
            <View style={[styles.tableHeader, { backgroundColor: COLORS.secondary }]} fixed>
              <Text style={[styles.tableHeaderText, styles.payDateCol]}>التاريخ</Text>
              <Text style={[styles.tableHeaderText, styles.paySafeCol]}>الخزنة / الحساب</Text>
              <Text style={[styles.tableHeaderText, styles.payUserCol]}>المسؤول</Text>
              <Text style={[styles.tableHeaderText, styles.payAmountCol]}>المبلغ</Text>
            </View>
            {invoice.payments.map((p: any, index: number) => (
              <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlternate : {}]}>
                <Text style={[styles.tableCellText, styles.payDateCol]}>{formatDate(p.created_at)}</Text>
                <Text style={[styles.tableCellText, styles.paySafeCol]}>{p.safe_name || '-'}</Text>
                <Text style={[styles.tableCellText, styles.payUserCol]}>{p.created_by_name || '-'}</Text>
                <Text style={[styles.tableCellText, styles.payAmountCol, { color: COLORS.success, fontWeight: 'bold' }]}>{formatMoney(p.amount)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.summaryWrapper} wrap={false}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>إجمالي المشتريات</Text><Text style={styles.summaryValue}>{formatMoney(invoice.total_amount)} ج.م</Text></View>
          {Number(invoice.discount) > 0 && (
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>الخصم المكتسب</Text><Text style={styles.summaryValue}>- {formatMoney(invoice.discount)} ج.م</Text></View>
          )}
          <View style={styles.totalRow}><Text style={styles.totalLabel}>الصافي المستحق</Text><Text style={styles.totalValue}>{formatMoney(invoice.net_amount)} ج.م</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>إجمالي المدفوع</Text><Text style={[styles.summaryValue, { color: COLORS.success }]}>{formatMoney(invoice.paid_amount)} ج.م</Text></View>
          <View style={styles.remainingRow}><Text style={styles.remainingLabel}>الباقي الآجل</Text><Text style={styles.remainingValue}>{formatMoney(Math.max(Number(invoice.net_amount) - Number(invoice.paid_amount), 0))} ج.م</Text></View>
        </View>
      </View>

      <View style={styles.footer} fixed>
        <Text style={styles.footerCompany}>MOHAMMED EMBABY ELECTROMECHANICAL</Text>
        <Text style={styles.footerContact}>Damietta    |    (+2) 01021217797</Text>
      </View>
      <Text style={styles.pageNumber} fixed render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </Page>
  </Document>
);

export const generatePurchaseInvoicePDF = async (invoice: any) => {
  try {
    const blob = await pdf(<PurchaseInvoicePDFDocument invoice={invoice} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Purchase_Invoice_${invoice.invoice_ref || 'Doc'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل ملف الـ PDF بنجاح");
  } catch (error) {
    console.error("PDF_GENERATE_ERROR:", error);
    toast.error("حدث خطأ أثناء إنشاء ملف الـ PDF");
  }
};