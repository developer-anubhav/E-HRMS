import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import Header from '../../components/Header';
import api from '../../api/axios';
import { COLORS } from '../../theme/colors';

export default function ManagementDashboardScreen() {
  const [stats, setStats] = useState(null);
  const [facialMetrics, setFacialMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('reports/dashboard');
      setStats(statsRes.data);

      const faceRes = await api.get('face/analytics');
      setFacialMetrics(faceRes.data?.metrics || null);
    } catch (e) {
      console.error('Fetch management dashboard metrics failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Management Hub" />
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={COLORS.emerald500} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Management Operations Hub</Text>
          <Text style={styles.subtitle}>Real-Time Headcount & AI Biometric KPI Dashboard</Text>

          <View style={styles.grid}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Total Employees</Text>
              <Text style={[styles.cardValue, { color: COLORS.emerald500 }]}>{stats?.totalEmployees || 0}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Present Today</Text>
              <Text style={[styles.cardValue, { color: COLORS.sky500 }]}>{stats?.presentToday || 0}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Absent Today</Text>
              <Text style={[styles.cardValue, { color: COLORS.rose600 }]}>{stats?.absentToday || 0}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Monthly Payroll</Text>
              <Text style={[styles.cardValue, { color: COLORS.amber500 }]}>${stats?.monthlyPayroll || 0}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Facial Check-Ins</Text>
              <Text style={[styles.cardValue, { color: COLORS.emerald500 }]}>{facialMetrics?.facialToday || 0}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Biometric Adoption</Text>
              <Text style={[styles.cardValue, { color: COLORS.indigo500 }]}>{facialMetrics?.adoptionRate || 0}%</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBg },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.slate400, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 14 },
  cardLabel: { fontSize: 12, color: COLORS.slate400, fontWeight: 'bold', marginBottom: 8 },
  cardValue: { fontSize: 22, fontWeight: 'bold' },
});
