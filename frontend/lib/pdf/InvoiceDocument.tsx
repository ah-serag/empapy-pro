import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

/* =========================================================
   FONT
========================================================= */

Font.register({
  family: 'Tajawal',
  fonts: [
    {
      src: `${
        typeof window !== 'undefined'
          ? window.location.origin
          : ''
      }/fonts/Tajawal-Regular.ttf`,
      fontWeight: 'normal',
    },
    {
      src: `${
        typeof window !== 'undefined'
          ? window.location.origin
          : ''
      }/fonts/Tajawal-Bold.ttf`,
      fontWeight: 'bold',
    },
  ],
});

/* =========================================================
   COLORS
========================================================= */

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

/* =========================================================
   STYLES
========================================================= */

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

  // --- BRAND BARS ---
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 7, flexDirection: 'row' },
  topBarBlue: { flex: 1, backgroundColor: COLORS.primary },
  topBarOrange: { width: 105, backgroundColor: COLORS.orange },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 7, flexDirection: 'row-reverse' },

  // --- HEADER ---
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

  // --- COMPANY / LOGO (RIGHT SIDE) ---
  companyBlock: {
    width: '45%',
    alignItems: 'flex-end',
  },
  // 🔴 اللوجو: متناسق تماماً ومريح للعين
  logoWrapper: {
    marginBottom: 16, 
    alignItems: 'center', // توسيط الكلمة العربية تحت الإنجليزية
    alignSelf: 'flex-end', // سحب كتلة اللوجو بالكامل لليمين
  },
  logoEnglishRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center', 
  },
  logoEM: { fontSize: 32, lineHeight: 1, fontWeight: 'bold', color: COLORS.orange },
  logoPAPY: { fontSize: 32, lineHeight: 1, fontWeight: 'bold', color: COLORS.primary },
  logoArabic: { 
    fontSize: 22, 
    lineHeight: 1, 
    fontWeight: 'bold', 
    color: COLORS.orange, 
    marginTop: 4, 
    letterSpacing: 1 // توزيع حروف خفيف للتناسق مع العرض
  },
  
  companyInfo: { marginTop: 5, fontSize: 7.2, color: COLORS.secondary, textAlign: 'right', lineHeight: 1.35 },

  // --- INVOICE META (LEFT SIDE) ---
  invoiceMetaBlock: {
    width: '45%',
    alignItems: 'flex-end', 
  },
  invoiceTitleWrapper: {
    marginBottom: 16,
    alignItems: 'flex-end',
    width: '100%',
  },
  invoiceTitle: { fontSize: 24, lineHeight: 1.2, fontWeight: 'bold', color: COLORS.primary, textAlign: 'right' },
  invoiceTitleEnglish: { fontSize: 7, color: COLORS.secondary, letterSpacing: 1.2, textAlign: 'right', marginBottom: 12 },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', width: '100%', minHeight: 18, marginBottom: 2 },
  metaLabel: { width: 60, fontSize: 8, color: COLORS.secondary, textAlign: 'right' },
  metaValue: { flex: 1, paddingRight: 6, fontSize: 8.5, fontWeight: 'bold', color: COLORS.text, textAlign: 'right' },

  // --- CUSTOMER / WORK INFORMATION ---
  informationGrid: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%', marginBottom: 18 },
  informationBox: { width: '48.5%', padding: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 5, backgroundColor: COLORS.white },
  informationBoxHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, marginBottom: 7, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  informationBoxTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary, textAlign: 'right' },
  informationRows: { width: '100%' },
  informationRow: { flexDirection: 'row-reverse', alignItems: 'center', width: '100%', minHeight: 18, marginBottom: 2 },
  informationLabel: { width: 65, fontSize: 8, color: COLORS.secondary, textAlign: 'right' },
  informationValue: { flex: 1, paddingRight: 8, fontSize: 8.5, fontWeight: 'bold', color: COLORS.text, textAlign: 'right' },

  // --- SECTION HEADER ---
  tableSection: { marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8 },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  sectionTitle: { marginHorizontal: 9, fontSize: 10, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center' },

  // --- TABLE ---
  table: { width: '100%', borderWidth: 1, borderColor: COLORS.border, borderRadius: 5, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row-reverse', alignItems: 'center', minHeight: 30, backgroundColor: COLORS.primary },
  tableRow: { flexDirection: 'row-reverse', alignItems: 'center', minHeight: 30, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.white },
  tableRowAlternate: { backgroundColor: COLORS.light },
  tableRowLast: { borderBottomWidth: 0 },
  numberColumn: { width: '8%', textAlign: 'center' },
  descriptionColumn: { width: '43%', textAlign: 'right' },
  quantityColumn: { width: '15%', textAlign: 'center' },
  priceColumn: { width: '15%', textAlign: 'center' },
  totalColumn: { width: '19%', textAlign: 'center' },
  tableHeaderText: { paddingHorizontal: 5, fontSize: 8, fontWeight: 'bold', color: COLORS.white },
  tableCellText: { paddingHorizontal: 5, fontSize: 8.5, color: COLORS.text },
  tableCellBold: { fontWeight: 'bold', color: COLORS.primary },

  // --- SUMMARY ---
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

  // --- THANK YOU NOTE ---
  thankYouBlock: { 
    marginTop: 25, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border, 
    alignItems: 'center' 
  },
  thankYouTitle: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: COLORS.primary, 
    marginBottom: 4 
  },
  thankYouSub: { 
    fontSize: 8.5, 
    color: COLORS.secondary 
  },

  // --- FOOTER ---
  footer: { position: 'absolute', left: 38, right: 38, bottom: 24, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.orange, alignItems: 'center' },
  footerCompany: { fontSize: 8.5, fontWeight: 'bold', color: COLORS.primary, marginBottom: 2 },
  footerContact: { fontSize: 7, color: COLORS.secondary, textAlign: 'center' },
  pageNumber: { position: 'absolute', left: 38, bottom: 11, fontSize: 6.5, color: COLORS.muted },
});

/* =========================================================
   HELPERS
========================================================= */

const formatMoney = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0);
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB');
};

const getInvoiceStatus = (status: string | undefined) => {
  switch (status) {
    case 'paid': return { text: 'مدفوعة بالكامل', color: COLORS.success };
    case 'partially_paid': return { text: 'مدفوعة جزئياً', color: COLORS.warning };
    case 'cancelled': return { text: 'ملغاة', color: COLORS.danger };
    default: return { text: 'غير مدفوعة (آجلة)', color: COLORS.orange };
  }
};

/* =========================================================
   INFORMATION ROW COMPONENT
========================================================= */

const InformationRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => {
  return (
    <View style={styles.informationRow}>
      <Text style={styles.informationLabel}>{label}</Text>
      <Text style={styles.informationValue}>{value || '-'}</Text>
    </View>
  );
};

/* =========================================================
   ITEMS TABLE COMPONENT
========================================================= */

const ItemsTable = ({ items }: { items: any[] }) => {
  if (!items?.length) return null;

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader} fixed>
        <Text style={[styles.tableHeaderText, styles.numberColumn]}>م</Text>
        <Text style={[styles.tableHeaderText, styles.descriptionColumn]}>البيان</Text>
        <Text style={[styles.tableHeaderText, styles.quantityColumn]}>الكمية</Text>
        <Text style={[styles.tableHeaderText, styles.priceColumn]}>السعر</Text>
        <Text style={[styles.tableHeaderText, styles.totalColumn]}>الإجمالي</Text>
      </View>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <View
            key={item.id ?? `${item.name}-${index}`}
            wrap={false}
            style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlternate : {}, isLast ? styles.tableRowLast : {}]}
          >
            <Text style={[styles.tableCellText, styles.numberColumn]}>{index + 1}</Text>
            <Text style={[styles.tableCellText, styles.descriptionColumn, { fontWeight: 'bold' }]}>{item.name}</Text>
            <Text style={[styles.tableCellText, styles.quantityColumn]}>{item.quantity}</Text>
            <Text style={[styles.tableCellText, styles.priceColumn]}>{formatMoney(item.unit_price)}</Text>
            <Text style={[styles.tableCellText, styles.totalColumn, styles.tableCellBold]}>{formatMoney(item.total_price)}</Text>
          </View>
        );
      })}
    </View>
  );
};

/* =========================================================
   INVOICE DOCUMENT
========================================================= */

export const InvoiceDocument = ({ invoice }: { invoice: any }) => {
  if (!invoice) return null;

  const subtotal = Number(invoice.subtotal || 0);
  const discount = Number(invoice.discount || 0);
  const totalAmount = Number(invoice.total_amount || 0);
  const paidAmount = Number(invoice.paid_amount || 0);
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);
  const status = getInvoiceStatus(invoice.invoice_status);

  return (
    <Document title={`فاتورة ${invoice.invoice_ref ?? ''}`} author="EMPABY">
      <Page size="A4" style={styles.page}>
        
        <View style={styles.topBar} fixed>
          <View style={styles.topBarBlue} />
          <View style={styles.topBarOrange} />
        </View>

        <View style={styles.bottomBar} fixed>
          <View style={styles.topBarOrange} />
          <View style={styles.topBarBlue} />
        </View>

        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          
          {/* RIGHT SIDE: COMPANY LOGO */}
          <View style={styles.companyBlock}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoEnglishRow}>
                <Text style={styles.logoEM}>EM</Text>
                <Text style={styles.logoPAPY}>PAPY</Text>
              </View>
              <Text style={styles.logoArabic}>إمبـابـي</Text>
            </View>
            <Text style={styles.companyInfo}>محمد إمبابي</Text>
            <Text style={styles.companyInfo}>دمياط - مصر</Text>
            <Text style={styles.companyInfo}>01021217797</Text>
          </View>

          {/* LEFT SIDE: INVOICE DETAILS */}
          <View style={styles.invoiceMetaBlock}>
            <View style={styles.invoiceTitleWrapper}>
              <Text style={styles.invoiceTitle}>فاتورة</Text>
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
              <Text style={styles.metaLabel}>المرجع</Text>
              <Text style={styles.metaValue}>#{invoice.assignment_ref}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>الحالة</Text>
              <Text style={[styles.metaValue, { color: status.color }]}>{status.text}</Text>
            </View>
          </View>

        </View>

        {/* ================= CUSTOMER + WORK DETAILS ================= */}
        <View style={styles.informationGrid}>
          
          <View style={styles.informationBox}>
            <View style={styles.informationBoxHeader}>
              <Text style={styles.informationBoxTitle}>بيانات العميل</Text>
            </View>
            <View style={styles.informationRows}>
              <InformationRow label="الاسم" value={invoice.contact_name} />
              <InformationRow label="الهاتف" value={invoice.contact_phone} />
              <InformationRow label="العنوان" value={invoice.address} />
            </View>
          </View>

          <View style={styles.informationBox}>
            <View style={styles.informationBoxHeader}>
              <Text style={styles.informationBoxTitle}>بيانات التنفيذ</Text>
            </View>
            <View style={styles.informationRows}>
              <InformationRow label="رقم الحجز" value={invoice.booking_ref} />
              <InformationRow label="الفريق" value={invoice.team_name} />
              <InformationRow label="رقم المهمة" value={invoice.assignment_id ? `#${invoice.assignment_id}` : '-'} />
            </View>
          </View>

        </View>

        {/* ================= SERVICES ================= */}
        {invoice.services_details?.length > 0 && (
          <View style={styles.tableSection}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>الخدمات المنفذة</Text>
              <View style={styles.sectionLine} />
            </View>
            <ItemsTable items={invoice.services_details} />
          </View>
        )}

        {/* ================= MATERIALS ================= */}
        {invoice.materials_details?.length > 0 && (
          <View style={styles.tableSection}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>قطع الغيار والخامات</Text>
              <View style={styles.sectionLine} />
            </View>
            <ItemsTable items={invoice.materials_details} />
          </View>
        )}

        {/* ================= FINANCIAL SUMMARY ================= */}
        <View style={styles.summaryWrapper} wrap={false}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>المجموع الفرعي</Text>
              <Text style={styles.summaryValue}>{formatMoney(subtotal)} EGP</Text>
            </View>

            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>الخصم</Text>
                <Text style={styles.summaryValue}>- {formatMoney(discount)} EGP</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>الإجمالي المستحق</Text>
              <Text style={styles.totalValue}>{formatMoney(totalAmount)} EGP</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>المدفوع</Text>
              <Text style={styles.summaryValue}>{formatMoney(paidAmount)} EGP</Text>
            </View>

            <View style={styles.remainingRow}>
              <Text style={styles.remainingLabel}>المتبقي</Text>
              <Text style={styles.remainingValue}>{formatMoney(remainingAmount)} EGP</Text>
            </View>
          </View>
        </View>

        {/* ================= THANK YOU NOTE ================= */}
        <View style={styles.thankYouBlock} wrap={false}>
          <Text style={styles.thankYouTitle}>شكرًا لثقتكم واختياركم شركة إمبابي</Text>
          <Text style={styles.thankYouSub}>نتطلع دائماً لخدمتكم بأعلى معايير الجودة والاحترافية</Text>
        </View>

        {/* ================= FOOTER ================= */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerCompany}>MOHAMMED EMBABY ELECTROMECHANICAL</Text>
          <Text style={styles.footerContact}>Damietta    |    (+2) 01021217797</Text>
        </View>

        <Text style={styles.pageNumber} fixed render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </Page>
    </Document>
  );
};

export default InvoiceDocument;