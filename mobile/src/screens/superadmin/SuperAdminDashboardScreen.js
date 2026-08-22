import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Header from '../../components/Header';
import api from '../../api/axios';
import { COLORS } from '../../theme/colors';

export default function SuperAdminDashboardScreen() {
  const [companies, setCompanies] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const fetchSuperAdminData = async () => {
    setLoading(true);
    try {
      const compRes = await api.get('superadmin/companies');
      setCompanies(Array.isArray(compRes.data?.data) ? compRes.data.data : []);

      const healthRes = await api.get('superadmin/health-stats');
      setSystemHealth(healthRes.data?.data || null);
    } catch (e) {
      console.error('Fetch superadmin data failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`superadmin/company/${id}/approve`);
      fetchSuperAdminData();
    } catch (e) {
      console.error('Approve failed:', e);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`superadmin/company/${id}/reject`);
      fetchSuperAdminData();
    } catch (e) {
      console.error('Reject failed:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="SuperAdmin Governance" />
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={COLORS.emerald500} />
        </View>
      ) : (
        <FlatList
          data={companies}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={() => (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.title}>SuperAdmin Command Center</Text>

              <View style={styles.healthCard}>
                <Text style={styles.healthTitle}>Platform Infrastructure Status</Text>
                <Text style={styles.healthSub}>DB Connection: {systemHealth?.dbStatus || 'Connected'} | Uptime: {systemHealth?.uptime || 'Active'}</Text>
                <Text style={styles.healthSub}>RAM RSS: {systemHealth?.memoryUsage || '0 MB'} | Heap: {systemHealth?.heapUsed || '0 MB'}</Text>
              </View>

              <Text style={styles.sectionHeader}>Registered Tenant Organizations</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.companyName}>{item.name}</Text>
                  <Text style={styles.adminText}>Admin: {item.adminName} ({item.email})</Text>
                  <Text style={[styles.statusText, { color: item.status === 'Active' ? COLORS.emerald500 : COLORS.amber500 }]}>
                    Status: {item.status}
                  </Text>
                </View>

                {item.status === 'Pending' && (
                  <View style={styles.btnRow}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.emerald500 }]} onPress={() => handleApprove(item._id)}>
                      <Text style={styles.btnLabel}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.rose600 }]} onPress={() => handleReject(item._id)}>
                      <Text style={styles.btnLabel}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBg },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 12 },
  healthCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 16 },
  healthTitle: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 14, marginBottom: 6 },
  healthSub: { color: COLORS.slate400, fontSize: 12, marginTop: 2 },
  sectionHeader: { color: COLORS.textPrimary, fontSize: 15, fontWeight: 'bold' },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 16, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  companyName: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
  adminText: { color: COLORS.slate400, fontSize: 12, marginTop: 2 },
  statusText: { fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  btnRow: { flexDirection: 'row' },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginLeft: 6 },
  btnLabel: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
});
