import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';

export default function EmployeeDashboardScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [todayAtt, setTodayAtt] = useState(null);
  const [history, setHistory] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const todayRes = await api.get('attendance/today');
      setTodayAtt(todayRes.data?.data || null);

      const histRes = await api.get('attendance');
      setHistory(Array.isArray(histRes.data) ? histRes.data.slice(0, 10) : []);

      const payRes = await api.get('payroll');
      setPayrolls(Array.isArray(payRes.data) ? payRes.data : []);
    } catch (e) {
      console.error('Fetch employee dashboard failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Employee Portal" />
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={COLORS.emerald500} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Welcome Card */}
          <View style={styles.card}>
            <Text style={styles.welcomeText}>Welcome back, {user} 👋</Text>
            <Text style={styles.subWelcome}>Portal: Self-Service Mobile Dashboard</Text>

            <TouchableOpacity
              style={styles.checkInBtn}
              onPress={() => navigation.navigate('MobileCheckIn')}
            >
              <Ionicons name="camera-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.checkInBtnText}>OPEN SELFIE & GPS CHECK-IN</Text>
            </TouchableOpacity>
          </View>

          {/* Today Status */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Today's Shift Status</Text>
            <View style={styles.statusRow}>
              <View>
                <Text style={[styles.statusText, { color: todayAtt?.status === 'Present' ? COLORS.emerald500 : COLORS.amber500 }]}>
                  {todayAtt?.status || 'Not Checked In'}
                </Text>
                {todayAtt?.checkInTime && (
                  <Text style={styles.timeDetail}>Check-In: {new Date(todayAtt.checkInTime).toLocaleTimeString()}</Text>
                )}
              </View>

              <View style={styles.methodTag}>
                <Text style={styles.methodTagText}>{todayAtt?.verificationMethod || 'Self-Service'}</Text>
              </View>
            </View>
          </View>

          {/* Recent Attendance */}
          <Text style={styles.sectionTitle}>Recent Attendance History</Text>
          {history.map((att, idx) => (
            <View key={att._id || idx} style={styles.listItem}>
              <View>
                <Text style={styles.itemDate}>{(att.date || '').take ? att.date.take(10) : String(att.date || '').slice(0, 10)}</Text>
                <Text style={styles.itemMethod}>{att.verificationMethod || 'Manual'}</Text>
              </View>
              <Text style={[styles.itemStatus, { color: att.status === 'Present' ? COLORS.emerald500 : COLORS.amber500 }]}>
                {att.status}
              </Text>
            </View>
          ))}

          {/* Payslips */}
          <Text style={styles.sectionTitle}>My Payslips & Compensation</Text>
          {payrolls.map((pay, idx) => (
            <View key={pay._id || idx} style={styles.listItem}>
              <View>
                <Text style={styles.itemDate}>Month: {pay.month}</Text>
                <Text style={styles.itemMethod}>Basic: ${pay.basicSalary} | Allowances: ${pay.allowances}</Text>
              </View>
              <Text style={[styles.itemStatus, { color: COLORS.emerald500 }]}>${pay.netSalary}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBg },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 16 },
  welcomeText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  subWelcome: { color: COLORS.slate400, fontSize: 12, marginBottom: 14 },
  checkInBtn: { backgroundColor: COLORS.emerald500, height: 48, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  checkInBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  cardHeader: { color: COLORS.slate400, fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { fontSize: 18, fontWeight: 'bold' },
  timeDetail: { color: COLORS.slate400, fontSize: 11, marginTop: 2 },
  methodTag: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  methodTagText: { color: COLORS.emerald500, fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
  listItem: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemDate: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 14 },
  itemMethod: { color: COLORS.slate400, fontSize: 11, marginTop: 2 },
  itemStatus: { fontWeight: 'bold', fontSize: 14 },
});
