import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import api from '../../api/axios';
import { COLORS } from '../../theme/colors';

export default function OrganizationSignupScreen({ navigation }) {
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSignup = async () => {
    if (!companyName.trim() || !adminName.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post('auth/organization-signup', {
        companyName: companyName.trim(),
        name: adminName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setLoading(false);
      setSuccess(res.data?.message || 'Organization registered successfully! You can now log in.');
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Register Organization</Text>
        <Text style={styles.subTitle}>Setup your multi-tenant Vektra HR workspace</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {success && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Company / Organization Name"
          placeholderTextColor={COLORS.slate400}
          value={companyName}
          onChangeText={setCompanyName}
        />

        <TextInput
          style={styles.input}
          placeholder="Admin Full Name"
          placeholderTextColor={COLORS.slate400}
          value={adminName}
          onChangeText={setAdminName}
        />

        <TextInput
          style={styles.input}
          placeholder="Admin Email Address"
          placeholderTextColor={COLORS.slate400}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.slate400}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>REGISTER WORKSPACE</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 16 }}>
          <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.screenBg, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 24, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.emerald500, marginBottom: 4 },
  subTitle: { fontSize: 12, color: COLORS.slate400, marginBottom: 20 },
  errorBox: { width: '100%', backgroundColor: 'rgba(225, 29, 72, 0.15)', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: COLORS.rose600, fontSize: 12, textAlign: 'center' },
  successBox: { width: '100%', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: 12, padding: 12, marginBottom: 16 },
  successText: { color: COLORS.emerald500, fontSize: 12, textAlign: 'center' },
  input: { width: '100%', backgroundColor: COLORS.screenBg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.slate700, paddingHorizontal: 14, height: 50, color: COLORS.textPrimary, marginBottom: 14 },
  btn: { width: '100%', height: 50, backgroundColor: COLORS.emerald500, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  linkText: { color: COLORS.slate400, fontSize: 13 },
});
