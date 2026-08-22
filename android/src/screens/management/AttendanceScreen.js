import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Header from '../../components/Header';
import api from '../../api/axios';
import { COLORS } from '../../theme/colors';

export default function AttendanceScreen() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('attendance');
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Fetch attendance logs failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Attendance Logs" />
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.emerald500} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={records}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.row}>
                  <View>
                    <Text style={styles.name}>{item.employee?.name || 'Employee'}</Text>
                    <Text style={styles.subText}>ID: {item.employee?.employeeId || 'N/A'} • Date: {String(item.date || '').slice(0, 10)}</Text>
                    <Text style={styles.subText}>Method: {item.verificationMethod || 'Manual'}</Text>
                  </View>

                  <Text style={[styles.status, { color: item.status === 'Present' ? COLORS.emerald500 : COLORS.rose600 }]}>
                    {item.status}
                  </Text>
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
  status: { fontWeight: 'bold', fontSize: 14 },
});
