import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native';
import Header from '../../components/Header';
import api from '../../api/axios';
import { COLORS } from '../../theme/colors';

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, [search]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('employees', { params: { search: search.trim() || undefined } });
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Fetch employees failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Staff Directory" />
      <View style={styles.content}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ID, department..."
          placeholderTextColor={COLORS.slate400}
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.emerald500} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={employees}
            keyExtractor={(item) => item._id || item.employeeId}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.row}>
                  <View>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.subText}>ID: {item.employeeId} • Dept: {item.department}</Text>
                    <Text style={styles.roleText}>Role: {item.role} • Salary: ${item.monthlySalary}</Text>
                  </View>

                  <View style={[styles.badge, { backgroundColor: item.faceProfile?.enrolled ? 'rgba(16, 185, 129, 0.2)' : COLORS.slate700 }]}>
                    <Text style={[styles.badgeText, { color: item.faceProfile?.enrolled ? COLORS.emerald500 : COLORS.slate400 }]}>
                      {item.faceProfile?.enrolled ? 'Biometrics Active' : 'Not Enrolled'}
                    </Text>
                  </View>
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
  searchInput: { backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.slate700, paddingHorizontal: 14, height: 48, color: COLORS.textPrimary, marginBottom: 16 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 16, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
  subText: { color: COLORS.slate400, fontSize: 12, marginTop: 2 },
  roleText: { color: COLORS.slate400, fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
});
