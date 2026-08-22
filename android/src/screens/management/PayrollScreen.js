import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Header from '../../components/Header';
import api from '../../api/axios';
import { COLORS } from '../../theme/colors';

export default function PayrollScreen() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await api.get('payroll');
      setPayrolls(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Fetch payroll entries failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Payroll Engine" />
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.emerald500} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={payrolls}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.row}>
                  <View>
                    <Text style={styles.name}>{item.employee?.name || 'Employee'}</Text>
                    <Text style={styles.subText}>Month: {item.month} • Basic: ${item.basicSalary}</Text>
                    <Text style={styles.subText}>Allowances: ${item.allowances} | Deductions: ${item.deductions}</Text>
                  </View>

                  <Text style={styles.netPay}>${item.netSalary}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBg },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 16, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 15 },
  subText: { color: COLORS.slate400, fontSize: 11, marginTop: 2 },
  netPay: { fontWeight: 'bold', fontSize: 18, color: COLORS.emerald500 },
});
