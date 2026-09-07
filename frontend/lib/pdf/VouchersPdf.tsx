import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';

Font.register({
  family: 'Tajawal',
  fonts: [
    { src: `${typeof window !== 'undefined' ? window.location.origin : ''}/fonts/Tajawal-Regular.ttf`, fontWeight: 'normal' },
    { src: `${typeof window !== 'undefined' ? window.location.origin : ''}/fonts/Tajawal-Bold.ttf`, fontWeight: 'bold' },
  ],
});

const pdfColors = {
  primaryBlue: '#173e54',
  primaryOrange: '#e8702a',
  darkText: '#1f2937',
  grayText: '#4b5563',
  lightGray: '#f9fafb',
  border: '#e5e7eb',
  emerald: '#15803d',
  danger: '#dc2626',
};

// تم تصغير كل المسافات والأحجام بدقة متناهية لضمان احتواء السند في صفحة A5 واحدة 100%
const pdfStyles = StyleSheet.create({
  page: { paddingTop: 20, paddingBottom: 35, paddingHorizontal: 25, fontFamily: 'Tajawal', backgroundColor: '#ffffff' },
  topBrandBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 6, flexDirection: 'row' },
  bottomBrandBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, flexDirection: 'row' },
  barBlue: { flex: 1, backgroundColor: pdfColors.primaryBlue },
  barOrange: { width: 100, backgroundColor: pdfColors.primaryOrange },
  
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: pdfColors.primaryBlue, paddingBottom: 6, marginBottom: 10, marginTop: 5 },
  halfSection: { width: '48%', alignItems: 'flex-end' },
  logoWrapper: { alignItems: 'center', marginBottom: 2 },
  logoTopLine: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center' },
  logoEM: { fontSize: 20, fontWeight: 'bold', color: pdfColors.primaryOrange, lineHeight: 1 },
  logoPABY: { fontSize: 20, fontWeight: 'bold', color: pdfColors.primaryBlue, lineHeight: 1 },
  logoArabic: { fontSize: 12, fontWeight: 'bold', color: pdfColors.primaryOrange, textAlign: 'center', marginTop: 2, letterSpacing: 1 },
  
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, textAlign: 'right' },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: 3, width: '100%' },
  infoLabel: { width: '35%', fontSize: 9, color: pdfColors.grayText, textAlign: 'right' },
  infoValue: { flex: 1, fontSize: 9, fontWeight: 'bold', color: pdfColors.darkText, textAlign: 'right', paddingRight: 4 },
  
  summaryGrid: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12, backgroundColor: pdfColors.lightGray, padding: 8, borderRadius: 6, borderWidth: 1, borderColor: pdfColors.border },
  summaryItem: { flex: 1, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: pdfColors.border },
  summaryItemNoBorder: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 8, color: pdfColors.grayText, marginBottom: 3 },
  summaryVal: { fontSize: 12, fontWeight: 'bold', color: pdfColors.primaryBlue },
  
  bodySection: { borderWidth: 1, borderColor: pdfColors.border, borderRadius: 6, padding: 12, marginBottom: 15, backgroundColor: '#ffffff' },
  bodyRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 10 },
  bodyLabel: { width: '22%', fontSize: 10, fontWeight: 'bold', color: pdfColors.primaryBlue, textAlign: 'right' },
  
  bodyContentWrapper: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', borderBottomWidth: 1, borderBottomStyle: 'dashed', borderBottomColor: pdfColors.grayText, paddingBottom: 4, paddingRight: 8 },
  bodyText: { fontSize: 10, color: pdfColors.darkText, textAlign: 'right' },
  amountNumber: { fontSize: 11, fontWeight: 'bold', color: pdfColors.darkText, marginLeft: 6 },
  amountWords: { fontSize: 10, color: pdfColors.grayText },
  
  signaturesWrapper: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 15, paddingHorizontal: 15 },
  signatureBlock: { width: '30%', alignItems: 'center' },
  signatureTitle: { fontSize: 10, fontWeight: 'bold', color: pdfColors.primaryBlue, marginBottom: 30 },
  signatureLine: { width: '100%', borderBottomWidth: 1, borderBottomColor: pdfColors.grayText },
  signatureName: { fontSize: 8, color: pdfColors.grayText, marginTop: 5, textAlign: 'center' },
  
  footer: { position: 'absolute', bottom: 12, left: 30, right: 30, borderTopWidth: 1, borderTopColor: pdfColors.primaryOrange, paddingTop: 6, alignItems: 'center' },
  footerCompany: { fontSize: 9, fontWeight: 'bold', color: pdfColors.primaryBlue, marginBottom: 2 },
  footerContact: { fontSize: 8, color: pdfColors.grayText, fontWeight: 'bold' }
});

const VoucherPDFDocument = ({ voucher }: { voucher: any }) => {
  const isReceipt = voucher.voucher_type === 'RECEIPT';
  const voucherTitle = isReceipt ? 'سند قبض نقدية' : 'سند صرف نقدية';
  const amountColor = isReceipt ? pdfColors.emerald : pdfColors.danger;
  const partyLabel = isReceipt ? 'استلمنا من السيد/ة' : 'يُصرف للسيد/ة';
  const amountNumber = Number(voucher.amount || 0);
  const formattedDate = voucher.voucher_date ? new Date(voucher.voucher_date).toLocaleDateString("en-GB", { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';

  return (
    <Document>
      <Page size="A5" orientation="landscape" style={pdfStyles.page}>
        <View style={pdfStyles.topBrandBar} fixed>
          <View style={pdfStyles.barBlue} />
          <View style={pdfStyles.barOrange} />
        </View>
        <View style={pdfStyles.bottomBrandBar} fixed>
          <View style={pdfStyles.barOrange} />
          <View style={pdfStyles.barBlue} />
        </View>

        <View style={pdfStyles.header}>
          <View style={pdfStyles.halfSection}>
            <View style={pdfStyles.logoWrapper}>
              <View style={pdfStyles.logoTopLine}>
                <Text style={pdfStyles.logoPABY}>PABY</Text>
                <Text style={pdfStyles.logoEM}>EM</Text>
              </View>
              <Text style={pdfStyles.logoArabic}>إمبـابـي</Text>
            </View>
          </View>
          <View style={pdfStyles.halfSection}>
            <Text style={[pdfStyles.title, { color: isReceipt ? pdfColors.emerald : pdfColors.danger }]}>{voucherTitle}</Text>
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>رقم السند</Text>
              <Text style={pdfStyles.infoValue}>{voucher.voucher_number || '-'}</Text>
            </View>
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>تاريخ الإصدار</Text>
              <Text style={pdfStyles.infoValue}>{formattedDate}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.summaryGrid}>
          <View style={pdfStyles.summaryItem}>
            <Text style={pdfStyles.summaryLabel}>المبلغ</Text>
            <Text style={[pdfStyles.summaryVal, { color: amountColor }]}>{amountNumber.toLocaleString()} ج.م</Text>
          </View>
          <View style={pdfStyles.summaryItem}>
            <Text style={pdfStyles.summaryLabel}>الخزينة</Text>
            <Text style={pdfStyles.summaryVal}>{voucher.safe_name || 'الخزينة الرئيسية'}</Text>
          </View>
          <View style={pdfStyles.summaryItemNoBorder}>
            <Text style={pdfStyles.summaryLabel}>البند المحاسبي</Text>
            <Text style={pdfStyles.summaryVal}>{voucher.account_name || 'غير محدد'}</Text>
          </View>
        </View>

        <View style={pdfStyles.bodySection}>
          <View style={pdfStyles.bodyRow}>
            <Text style={pdfStyles.bodyLabel}>{partyLabel}</Text>
            <View style={pdfStyles.bodyContentWrapper}>
              <Text style={pdfStyles.bodyText}></Text>
            </View>
          </View>
          
          <View style={pdfStyles.bodyRow}>
            <Text style={pdfStyles.bodyLabel}>مبلغ وقدره</Text>
            <View style={pdfStyles.bodyContentWrapper}>
              <Text style={pdfStyles.amountNumber}>{amountNumber.toLocaleString()}</Text>
              <Text style={pdfStyles.amountWords}>جنيهاً مصرياً فقط لا غير.</Text>
            </View>
          </View>

          <View style={pdfStyles.bodyRow}>
            <Text style={pdfStyles.bodyLabel}>وذلك قيمة</Text>
            <View style={pdfStyles.bodyContentWrapper}>
              <Text style={pdfStyles.bodyText}>{voucher.description || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.signaturesWrapper}>
          <View style={pdfStyles.signatureBlock}>
            <Text style={pdfStyles.signatureTitle}>المستلم</Text>
            <View style={pdfStyles.signatureLine} />
            <Text style={pdfStyles.signatureName}>الاسم والتوقيع</Text>
          </View>
          <View style={pdfStyles.signatureBlock}>
            <Text style={pdfStyles.signatureTitle}>أمين الخزينة</Text>
            <View style={pdfStyles.signatureLine} />
            <Text style={pdfStyles.signatureName}>{voucher.created_by_name || 'مُصدر السند'}</Text>
          </View>
          <View style={pdfStyles.signatureBlock}>
            <Text style={pdfStyles.signatureTitle}>المدير المسئول</Text>
            <View style={pdfStyles.signatureLine} />
            <Text style={pdfStyles.signatureName}>الاعتماد</Text>
          </View>
        </View>

        <View style={pdfStyles.footer} fixed>
          <Text style={pdfStyles.footerCompany}>MOHAMMED EMBABY ELECTROMECHANICAL</Text>
          <Text style={pdfStyles.footerContact}>Damietta    |    (+2) 01021217797</Text>
        </View>
      </Page>
    </Document>
  );
};

export const generateVoucherPDF = async (voucher: any) => {
  try {
    const blob = await pdf(<VoucherPDFDocument voucher={voucher} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const prefix = voucher.voucher_type === 'RECEIPT' ? 'Receipt' : 'Payment';
    link.download = `${prefix}_Voucher_${voucher.voucher_number || 'Doc'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    toast.error("حدث خطأ أثناء إنشاء ملف الـ PDF");
  }
};