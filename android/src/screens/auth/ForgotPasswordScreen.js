import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../api/axios';
import { COLORS } from '../../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleReset = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('auth/forgot-password', { email: email.trim().toLowerCase() });
      setLoading(false);
      setMsg(res.data?.message || 'If the email exists, a reset link has been dispatched.');
    } catch (e) {
      setLoading(false);
      setMsg('If the email exists, a reset link has been dispatched.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subTitle}>Enter your email to receive a password reset link.</Text>

        {msg && (
          <View style={styles.msgBox}>
            <Text style={styles.msgText}>{msg}</Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor={COLORS.slate400}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.btn} onPress={handleReset} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>SEND RESET LINK</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 16 }}>
          <Text style={styles.linkText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBg, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 24, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.emerald500, marginBottom: 4 },
  subTitle: { fontSize: 12, color: COLORS.slate400, marginBottom: 20, textAlign: 'center' },
  msgBox: { width: '100%', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: 12, padding: 12, marginBottom: 16 },
  msgText: { color: COLORS.emerald500, fontSize: 12, textAlign: 'center' },
  input: { width: '100%', backgroundColor: COLORS.screenBg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.slate700, paddingHorizontal: 14, height: 50, color: COLORS.textPrimary, marginBottom: 16 },
  btn: { width: '100%', height: 50, backgroundColor: COLORS.emerald500, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  linkText: { color: COLORS.slate400, fontSize: 13 },
});
