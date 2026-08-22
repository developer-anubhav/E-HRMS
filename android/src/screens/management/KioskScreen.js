import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import api from '../../api/axios';
import { COLORS } from '../../theme/colors';

export default function KioskScreen() {
  const cameraRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [statusText, setStatusText] = useState('Position your face in front of the camera terminal');

  const handleKioskScan = async () => {
    if (!cameraRef.current) return;

    setCapturing(true);
    setStatusText('Analyzing facial biometrics...');
    setMatchResult(null);

    try {
      const photo1 = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      await new Promise(r => setTimeout(r, 250));
      const photo2 = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });

      const res = await api.post('face/verify-checkin', {
        image: `data:image/jpeg;base64,${photo2.base64}`,
        prevImage: `data:image/jpeg;base64,${photo1.base64}`,
      });

      setCapturing(false);
      setMatchResult(res.data);
      setStatusText(res.data?.message || 'Verification complete!');

      setTimeout(() => {
        setMatchResult(null);
        setStatusText('Position your face in front of the camera terminal');
      }, 4000);
    } catch (err) {
      setCapturing(false);
      const msg = err.response?.data?.message || 'Face not recognized. Please face camera directly.';
      setStatusText(msg);
      setTimeout(() => setStatusText('Position your face in front of the camera terminal'), 3000);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Touchless Kiosk Mode" />
      <View style={styles.content}>
        <Text style={styles.subtitle}>High-Speed Reception Counter Terminal (1:N Match)</Text>

        <View style={styles.cameraBox}>
          <CameraView style={styles.camera} facing="front" ref={cameraRef} />

          {matchResult && (
            <View style={styles.matchOverlay}>
              <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.emerald500} />
              <Text style={styles.matchName}>{matchResult.employee?.name || 'Matched'}</Text>
              <Text style={styles.matchSub}>{matchResult.employee?.department} • ID: {matchResult.employee?.employeeId}</Text>
              <View style={styles.matchTag}>
                <Text style={styles.matchTagText}>
                  {matchResult.actionType || 'CHECK_IN'} SUCCESS ({matchResult.verification?.confidence || 98}% Match)
                </Text>
              </View>
            </View>
          )}

          {capturing && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.emerald500} />
            </View>
          )}
        </View>

        <Text style={styles.statusText}>{statusText}</Text>

        <TouchableOpacity
          style={styles.scanBtn}
          onPress={handleKioskScan}
          disabled={capturing || !!matchResult}
        >
          <Ionicons name="refresh" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.scanBtnText}>TRIGGER BIOMETRIC SCAN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBg },
  content: { flex: 1, padding: 16, alignItems: 'center' },
  subtitle: { color: COLORS.slate400, fontSize: 12, marginBottom: 16 },
  cameraBox: { width: '100%', flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: COLORS.cardBg, marginBottom: 16 },
  camera: { flex: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  matchOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  matchName: { color: '#FFF', fontWeight: 'bold', fontSize: 22, marginTop: 10 },
  matchSub: { color: COLORS.slate400, fontSize: 13, marginTop: 2 },
  matchTag: { backgroundColor: COLORS.emerald500, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginTop: 16 },
  matchTagText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  statusText: { color: COLORS.slate400, fontSize: 13, marginBottom: 16, textAlign: 'center' },
  scanBtn: { width: '100%', height: 52, backgroundColor: COLORS.emerald500, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  scanBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});
