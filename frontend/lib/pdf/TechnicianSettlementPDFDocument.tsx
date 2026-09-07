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

// تسجيل الخط العربي
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
  invoiceSubTitle: { fontSize: 10, color: COLORS.secondary, marginTop: 4, textAlign: 'right' },
  
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
  
  // 🔴 تم إضافة paddingVertical ليعطي مساحة مريحة للعين فوق وتحت النص
  tableRow: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    minHeight: 35, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border, 
    backgroundColor: COLORS.white,
    paddingVertical: 8 
  },
  tableRowAlternate: { backgroundColor: COLORS.light },
  
  tableHeaderText: { paddingHorizontal: 5, fontSize: 8, fontWeight: 'bold', color: COLORS.white },
  
  // 🔴 تم تصغير الخط وجعله Normal بدلاً من Bold
  tableCellText: { paddingHorizontal: 5, fontSize: 7.5, color: COLORS.text, fontWeight: 'normal' },

  // عرض الأعمدة
  colNo: { width: '5%', textAlign: 'center' },
  colCustomer: { width: '25%', textAlign: 'right' },
  colDate: { width: '15%', textAlign: 'center' },
  colServices: { width: '40%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'center' },

  colAdvDate: { width: '20%', textAlign: 'center' },
  colAdvNotes: { width: '60%', textAlign: 'right' },
  colAdvAmount: { width: '15%', textAlign: 'center', fontWeight: 'bold', color: COLORS.danger },

  summaryWrapper: { width: '100%', marginTop: 4, marginBottom: 15 },
  summaryBox: { width: '100%', borderWidth: 1, borderColor: COLORS.border, borderRadius: 5, overflow: 'hidden' },
  summaryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', minHeight: 29, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  summaryLabel: { fontSize: 8.5, color: COLORS.secondary, textAlign: 'right' },
  summaryValue: { fontSize: 8.5, fontWeight: 'bold', color: COLORS.text, textAlign: 'left' },
  totalRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', minHeight: 40, paddingHorizontal: 12, backgroundColor: COLORS.primary },
  totalLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.white, textAlign: 'right' },
  totalValue: { fontSize: 13, fontWeight: 'bold', color: COLORS.white, textAlign: 'left' },

  footer: { position: 'absolute', left: 38, right: 38, bottom: 24, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.orange, alignItems: 'center' },
  footerCompany: { fontSize: 8.5, fontWeight: 'bold', color: COLORS.primary, marginBottom: 2 },
  footerContact: { fontSize: 7, color: COLORS.secondary, textAlign: 'center' },
  pageNumber: { position: 'absolute', left: 38, bottom: 11, fontSize: 6.5, color: COLORS.muted },
});

const formatMoney = (val: any) => Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (val: any) => val ? new Date(val).toLocaleDateString('en-GB') : '-';

const TechnicianSettlementPDFDocument = ({ data }: { data: any }) => {
  const { technician, tasks, advances, summary } = data;
  
  return (
    <Document title={`Settlement_${technician?.full_name || 'Tech'}`} author="EMPABY">
      <Page size="A4" style={styles.page}>
        
        {/* ================= Header ================= */}
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
              <Text style={styles.invoiceTitle}>كشف حساب وتسوية</Text>
              <Text style={styles.invoiceSubTitle}>مستحقات فني</Text>
            </View>
          </View>
        </View>

        {/* ================= Information Grid ================= */}
        <View style={styles.informationGrid}>
          <View style={styles.informationBox}>
            <View style={styles.informationBoxHeader}>
              <Text style={styles.informationBoxTitle}>بيانات الفني</Text>
            </View>
            <View style={styles.informationRows}>
              <View style={styles.informationRow}>
                <Text style={styles.informationLabel}>الاسم</Text>
                <Text style={styles.informationValue}>{technician?.full_name || technician?.name}</Text>
              </View>
              <View style={styles.informationRow}>
                <Text style={styles.informationLabel}>تاريخ الكشف</Text>
                <Text style={styles.informationValue}>{formatDate(new Date())}</Text>
              </View>
            </View>
          </View>

          <View style={styles.informationBox}>
            <View style={styles.informationBoxHeader}>
              <Text style={styles.informationBoxTitle}>ملخص الإنجازات</Text>
            </View>
            <View style={styles.informationRows}>
              <View style={styles.informationRow}>
                <Text style={styles.informationLabel}>عدد الزيارات</Text>
                <Text style={styles.informationValue}>{summary?.visits_count || 0} زيارة / عميل</Text>
              </View>
              <View style={styles.informationRow}>
                <Text style={styles.informationLabel}>الخدمات المنفذة</Text>
                <Text style={styles.informationValue}>{summary?.services_count || 0} خدمة</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================= Tasks Table ================= */}
        {tasks && tasks.length > 0 && (
          <View style={styles.tableSection}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>بيان المهام والزيارات المنجزة</Text>
              <View style={styles.sectionLine} />
            </View>
            
            <View style={styles.table}>
              <View style={styles.tableHeader} fixed>
                <Text style={[styles.tableHeaderText, styles.colNo]}>م</Text>
                <Text style={[styles.tableHeaderText, styles.colCustomer]}>العميل ورقم المهمة</Text>
                <Text style={[styles.tableHeaderText, styles.colDate]}>تاريخ الزيارة</Text>
                <Text style={[styles.tableHeaderText, styles.colServices]}>الخدمات المنفذة وتفاصيلها</Text>
                <Text style={[styles.tableHeaderText, styles.colTotal]}>إجمالي المهمة</Text>
              </View>
              
              {tasks.map((task: any, index: number) => (
                <View key={index} wrap={false} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlternate : {}]}>
                  <Text style={[styles.tableCellText, styles.colNo]}>{index + 1}</Text>
                  
                  <View style={[styles.colCustomer, { paddingHorizontal: 5 }]}>
                    <Text style={{ fontSize: 8, fontWeight: 'normal', color: COLORS.text, textAlign: 'right' }}>{task.customer_name}</Text>
                    <Text style={{ fontSize: 6.5, color: COLORS.secondary, textAlign: 'right', marginTop: 3 }}>{task.assignment_ref}</Text>
                  </View>
                  
                  <Text style={[styles.tableCellText, styles.colDate]}>{formatDate(task.visit_date)}</Text>
                  
                  <View style={[styles.colServices, { paddingHorizontal: 5 }]}>
                    {task.services?.map((srv: any, sIdx: number) => (
                      <Text key={sIdx} style={{ fontSize: 7.5, color: COLORS.text, textAlign: 'right', marginBottom: 3, fontWeight: 'normal' }}>
                        • {srv.service_name} (كمية: {Number(srv.service_quantity)}) : {formatMoney(srv.earned_amount)} ج.م
                      </Text>
                    ))}
                  </View>

                  <Text style={[styles.tableCellText, styles.colTotal, { fontWeight: 'bold', color: COLORS.success }]}>
                    {formatMoney(task.task_total_earned)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ================= Advances Table ================= */}
        {advances && advances.length > 0 && (
          <View style={styles.tableSection} wrap={false}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>بيان السلف النقدية (المديونية المخصومة)</Text>
              <View style={styles.sectionLine} />
            </View>
            
            <View style={styles.table}>
              <View style={[styles.tableHeader, { backgroundColor: COLORS.danger }]} fixed>
                <Text style={[styles.tableHeaderText, styles.colNo]}>م</Text>
                <Text style={[styles.tableHeaderText, styles.colAdvDate]}>التاريخ</Text>
                <Text style={[styles.tableHeaderText, styles.colAdvNotes]}>البيان / الملاحظات</Text>
                <Text style={[styles.tableHeaderText, styles.colAdvAmount]}>المبلغ المخصوم</Text>
              </View>
              
              {advances.map((adv: any, index: number) => (
                <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlternate : {}]}>
                  <Text style={[styles.tableCellText, styles.colNo]}>{index + 1}</Text>
                  <Text style={[styles.tableCellText, styles.colAdvDate]}>{formatDate(adv.created_at)}</Text>
                  <Text style={[styles.tableCellText, styles.colAdvNotes]}>{adv.notes || 'سلفة نقدية'}</Text>
                  <Text style={[styles.tableCellText, styles.colAdvAmount, { color: COLORS.danger, fontWeight: 'bold' }]}>
                    - {formatMoney(adv.amount)} ج.م
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ================= Financial Summary ================= */}
        <View style={styles.summaryWrapper} wrap={false}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>إجمالي الأرباح والمستحقات</Text>
              <Text style={styles.summaryValue}>{formatMoney(summary?.total_earnings)} ج.م</Text>
            </View>
            
            {Number(summary?.total_advances) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>إجمالي السلف المخصومة</Text>
                <Text style={[styles.summaryValue, { color: COLORS.danger }]}>- {formatMoney(summary.total_advances)} ج.م</Text>
              </View>
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>الصافي المستحق للدفع</Text>
              <Text style={styles.totalValue}>{formatMoney(summary?.net_amount)} ج.م</Text>
            </View>
          </View>
        </View>

        {/* ================= Footer ================= */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerCompany}>MOHAMMED EMBABY ELECTROMECHANICAL</Text>
          <Text style={styles.footerContact}>Damietta    |    (+2) 01021217797</Text>
        </View>
        <Text style={styles.pageNumber} fixed render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      
      </Page>
    </Document>
  );
};

export const generateTechnicianSettlementPDF = async (data: any) => {
  try {
    const blob = await pdf(<TechnicianSettlementPDFDocument data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Settlement_${data.technician?.full_name || 'Doc'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("PDF_GENERATE_ERROR:", error);
    toast.error("حدث خطأ أثناء إنشاء كشف الحساب");
  }
};