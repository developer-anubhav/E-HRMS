import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import api from '../../api/axios';
import { COLORS } from '../../theme/colors';

export default function MobileCheckInScreen({ navigation }) {
  const cameraRef = useRef(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus.status === 'granted');
    })();
  }, []);

  const handleCheckIn = async () => {
    if (!cameraRef.current) return;

    setCapturing(true);
    setError(null);
    setResult(null);

    try {
      // 1. Capture Frame 1 (Previous frame for Liveness sequence)
      const photo1 = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      
      // Delay ~250ms for eye blink motion sequence
      await new Promise(r => setTimeout(r, 250));

      // 2. Capture Frame 2 (Current frame)
      const photo2 = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });

      // 3. Get GPS Location
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      const acc = location.coords.accuracy;

      // 4. Send to Render API /api/face/mobile-checkin
      const res = await api.post('face/mobile-checkin', {
        image: `data:image/jpeg;base64,${photo2.base64}`,
        prevImage: `data:image/jpeg;base64,${photo1.base64}`,
        latitude: lat,
        longitude: lng,
        accuracy: acc,
      });

      setCapturing(false);
      setResult(res.data);
    } catch (err) {
      setCapturing(false);
      const msg = err.response?.data?.message || err.message || 'Check-in failed. Ensure your face is clear and you are within office geofence.';
      setError(msg);
    }
  };

  if (hasCameraPermission === false || hasLocationPermission === false) {
    return (
      <View style={styles.container}>
        <Header title="Mobile Check-In" />
        <View style={styles.permissionCenter}>
          <Ionicons name="warning-outline" size={48} color={COLORS.amber500} />
          <Text style={styles.permissionText}>Camera and Location permissions are required for GPS Geofence and AI Face Verification.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Mobile Selfie Check-In" />
      <View style={styles.content}>
        <Text style={styles.title}>GPS Geofence + AI Dual-Frame Liveness Verification</Text>

        <View style={styles.cameraBox}>
          <CameraView style={styles.camera} facing="front" ref={cameraRef} />

          {capturing && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color={COLORS.emerald500} />
              <Text style={styles.overlayText}>Evaluating FaceNet & Geofence...</Text>
            </View>
          )}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>{result.message}</Text>
            {result.geofence && (
              <Text style={styles.resultSub}>Geofence: {result.geofence.geofenceStatus} ({result.geofence.distanceMeters}m from office)</Text>
            )}
            {result.verification && (
              <Text style={styles.resultScore}>Match Confidence: {result.verification.confidence}%</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.captureBtn}
          onPress={handleCheckIn}
          disabled={capturing}
        >
          <Ionicons name="camera" size={22} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.captureBtnText}>{capturing ? 'VERIFYING...' : 'CAPTURE SELFIE & CHECK-IN'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBg },
  content: { flex: 1, padding: 16, alignItems: 'center' },
  title: { color: COLORS.slate400, fontSize: 12, marginBottom: 16, textAlign: 'center' },
  cameraBox: { width: '100%', height: 360, borderRadius: 24, overflow: 'hidden', backgroundColor: COLORS.cardBg, marginBottom: 16 },
  camera: { flex: 1 },
  permissionCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  permissionText: { color: COLORS.textPrimary, textAlign: 'center', marginTop: 12, fontSize: 14 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  overlayText: { color: '#FFF', fontWeight: 'bold', marginTop: 12 },
  errorBox: { width: '100%', backgroundColor: 'rgba(225, 29, 72, 0.15)', borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText: { color: COLORS.rose600, fontSize: 12, textAlign: 'center' },
  resultBox: { width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14, marginBottom: 12 },
  resultTitle: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 14 },
  resultSub: { color: COLORS.slate400, fontSize: 11, marginTop: 4 },
  resultScore: { color: COLORS.emerald500, fontWeight: 'bold', fontSize: 12, marginTop: 4 },
  captureBtn: { width: '100%', height: 52, backgroundColor: COLORS.emerald500, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  captureBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});
