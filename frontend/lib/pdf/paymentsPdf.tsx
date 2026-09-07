import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';

Font.register({
  family: 'Tajawal',
  fonts: [
    { src: `${typeof window !== 'undefined' ? window.location.origin : ''}/fonts/Tajawal-Regular.ttf`, fontWeight: 'normal' },
    { src: `${typeof window !== 'undefined' ? window.location.origin : ''}/fonts/Tajawal-Bold.ttf`, fontWeight: 'bold' },
  ],
});

const colors = {
  primaryBlue: '#173e54',
  primaryOrange: '#e8702a',
  darkText: '#1f2937',
  grayText: '#4b5563',
  lightGray: '#f9fafb',
  border: '#e5e7eb',
  emerald: '#15803d',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 70,
    paddingHorizontal: 40,
    fontFamily: 'Tajawal',
    backgroundColor: '#ffffff',
  },
  topBrandBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 10, flexDirection: 'row' },
  bottomBrandBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 12, flexDirection: 'row' },
  barBlue: { flex: 1, backgroundColor: colors.primaryBlue },
  barOrange: { width: 120, backgroundColor: colors.primaryOrange },
  header: {
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.primaryBlue,
    paddingBottom: 12,
    marginBottom: 15,
    marginTop: 15,
  },
  halfSection: { width: '48%', alignItems: 'flex-end' },
  
  // 🔴 تعديل اللوجو ليكون EM أولاً ثم PAPY وتحتهم إمبابي في المنتصف
  logoWrapper: { alignItems: 'center', marginBottom: 4 },
  logoTopLine: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center' },
  logoEM: { fontSize: 26, fontWeight: 'bold', color: colors.primaryOrange, lineHeight: 1 },
  logoPABY: { fontSize: 26, fontWeight: 'bold', color: colors.primaryBlue, lineHeight: 1 },
  logoArabic: { fontSize: 18, fontWeight: 'bold', color: colors.primaryOrange, textAlign: 'center', marginTop: 4, letterSpacing: 1 },

  title: { fontSize: 18, fontWeight: 'bold', color: colors.primaryBlue, marginBottom: 8, textAlign: 'right' },
  
  // 🔴 إزالة النقطتين من البيانات
  infoRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: 4, width: '100%' },
  infoLabel: { width: '32%', fontSize: 8.5, color: colors.grayText, textAlign: 'right' },
  infoValue: { flex: 1, fontSize: 8.5, fontWeight: 'bold', color: colors.darkText, textAlign: 'right', paddingRight: 4 },

  summaryGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: colors.lightGray,
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: { width: '32%', alignItems: 'center' },
  summaryLabel: { fontSize: 8, color: colors.grayText, marginBottom: 2 },
  summaryVal: { fontSize: 11, fontWeight: 'bold', color: colors.primaryBlue },
  tableContainer: { marginBottom: 15 },
  tableTitle: { fontSize: 11, fontWeight: 'bold', color: colors.primaryBlue, marginBottom: 6, textAlign: 'right' },
  tableHeader: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.primaryBlue,
    paddingVertical: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableRow: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  tableRowAlternate: { backgroundColor: colors.lightGray },
  colId: { width: '8%', textAlign: 'center', fontSize: 8.5, color: colors.grayText },
  colDate: { width: '25%', textAlign: 'right', fontSize: 8.5, color: colors.darkText, paddingRight: 4 },
  colMethod: { width: '22%', textAlign: 'center', fontSize: 8.5, fontWeight: 'bold', color: colors.primaryBlue },
  colSafe: { width: '25%', textAlign: 'right', fontSize: 8.5, color: colors.grayText, paddingRight: 4 },
  colAmount: { width: '20%', textAlign: 'left', fontSize: 8.5, fontWeight: 'bold', color: colors.emerald, paddingLeft: 8 },
  colHeaderId: { width: '8%', textAlign: 'center', fontSize: 8.5, fontWeight: 'bold', color: '#ffffff' },
  colHeaderDate: { width: '25%', textAlign: 'right', fontSize: 8.5, fontWeight: 'bold', color: '#ffffff', paddingRight: 4 },
  colHeaderMethod: { width: '22%', textAlign: 'center', fontSize: 8.5, fontWeight: 'bold', color: '#ffffff' },
  colHeaderSafe: { width: '25%', textAlign: 'right', fontSize: 8.5, fontWeight: 'bold', color: '#ffffff', paddingRight: 4 },
  colHeaderAmount: { width: '20%', textAlign: 'left', fontSize: 8.5, fontWeight: 'bold', color: '#ffffff', paddingLeft: 8 },
  footer: {
    position: 'absolute', bottom: 25, left: 40, right: 40,
    borderTopWidth: 1.5, borderTopColor: colors.primaryOrange, 
    paddingTop: 10, alignItems: 'center',
  },
  footerCompany: { fontSize: 10, fontWeight: 'bold', color: colors.primaryBlue, marginBottom: 2 },
  footerContact: { fontSize: 8, color: colors.grayText, fontWeight: 'bold' },
  pageNumber: { position: 'absolute', bottom: 12, left: 40, fontSize: 7.5, color: colors.grayText }
});

const PaymentsPDFDocument = ({ invoice }: { invoice: any }) => {
  const totalAmount = Number(invoice.total_amount || 0);
  const paidAmount = Number(invoice.paid_amount || 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const payments = invoice.payments || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBrandBar} fixed>
          <View style={styles.barBlue} />
          <View style={styles.barOrange} />
        </View>
        <View style={styles.bottomBrandBar} fixed>
          <View style={styles.barOrange} />
          <View style={styles.barBlue} />
        </View>

        <View style={styles.header}>
          <View style={styles.halfSection}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoTopLine}>
               <Text style={styles.logoPABY}>PABY</Text>

                <Text style={styles.logoEM}>EM</Text>
              </View>
              <Text style={styles.logoArabic}>إمبـابـي</Text>
            </View>
          </View>
          <View style={styles.halfSection}>
            <Text style={styles.title}>كشف حساب الدفعات</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>رقم الفاتورة</Text>
              <Text style={styles.infoValue}>{invoice.invoice_ref}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>اسم العميل</Text>
              <Text style={styles.infoValue}>{invoice.contact_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>رقم الهاتف</Text>
              <Text style={styles.infoValue}>{invoice.contact_phone || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>إجمالي الفاتورة</Text>
            <Text style={styles.summaryVal}>{totalAmount.toLocaleString()} ج.م</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>إجمالي المدفوع</Text>
            <Text style={[styles.summaryVal, { color: colors.emerald }]}>{paidAmount.toLocaleString()} ج.م</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>المتبقي</Text>
            <Text style={[styles.summaryVal, { color: remainingAmount > 0 ? colors.primaryOrange : colors.grayText }]}>
              {remainingAmount.toLocaleString()} ج.م
            </Text>
          </View>
        </View>

        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>تفاصيل حركات التحصيل</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colHeaderId}>م</Text>
            <Text style={styles.colHeaderDate}>التاريخ والوقت</Text>
            <Text style={styles.colHeaderMethod}>طريقة الدفع</Text>
            <Text style={styles.colHeaderSafe}>الخزنة / الجهة</Text>
            <Text style={styles.colHeaderAmount}>المبلغ</Text>
          </View>
          {payments.length === 0 ? (
            <View style={[styles.tableRow, { padding: 15, justifyContent: 'center' }]}>
              <Text style={{ fontSize: 9, color: colors.grayText }}>لا توجد دفعات مسجلة لهذه الفاتورة.</Text>
            </View>
          ) : (
            payments.map((p: any, i: number) => (
              <View style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlternate : {}]} key={p.id || i} wrap={false}>
                <Text style={styles.colId}>{i + 1}</Text>
                <Text style={styles.colDate}>{new Date(p.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</Text>
                <Text style={styles.colMethod}>{p.payment_method === 'CASH' ? 'كاش (نقدي)' : 'تحويل بنكي'}</Text>
                <Text style={styles.colSafe}>{p.safe_name || 'الخزنة الرئيسية'}</Text>
                <Text style={styles.colAmount}>+{Number(p.amount).toLocaleString()} ج.م</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerCompany}>MOHAMMED EMBABY ELECTROMECHANICAL</Text>
          <Text style={styles.footerContact}>Damietta    |    (+2) 01021217797</Text>
        </View>
        
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (`Page ${pageNumber} of ${totalPages}`)} fixed />
      </Page>
    </Document>
  );
};

export const generatePaymentsPDF = async (invoice: any) => {
  const blob = await pdf(<PaymentsPDFDocument invoice={invoice} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Payments-${invoice.invoice_ref || 'Statement'}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};