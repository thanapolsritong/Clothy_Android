import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TextInput,
  TouchableOpacity, Alert, Image, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useTailorStore, OutfitStatus } from '../store';

const OUTFIT_STYLES = [
  'คอปกแขนยาว', 'คอปกแขนสั้น', 'คอกลมแขนยาว', 'คอกลมแขนสั้น',
  'คอวีแขนยาว', 'คอวีแขนสั้น', 'ชุดเดรสแขนยาว', 'ชุดเดรสแขนสั้น',
  'กระโปรงทรงเอ', 'กระโปรงทรงตรง', 'กระโปรงบาน',
  'กางเกงขายาว', 'กางเกงขาม้า', 'กางเกงขาสั้น', 'กางเกงทรงกระบอก',
  'ชุดสูท', 'ชุดข้าราชการ', 'อื่นๆ'
];

export default function OutfitDetail({ route }: any) {
  const { outfitId } = route.params;
  const { outfits, updateMeasurements, updateOutfitStatus } = useTailorStore();
  const outfit = outfits.find(o => o.id === outfitId);

  const [measurements, setMeasurements] = useState(outfit?.measurements || {});
  const [photos, setPhotos] = useState<string[]>(outfit?.measurements?.photos || []);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);

  const updateField = (field: string, value: any) => {
    setMeasurements((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateMeasurements(outfitId, { ...measurements, photos });
    Alert.alert('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว');
  };

  const parseDate = (val: string): Date => {
    if (!val) return new Date();
    const parts = val.split('/');
    if (parts.length !== 3) return new Date();
    const d = parseInt(parts[0]);
    const m = parseInt(parts[1]) - 1;
    let y = parseInt(parts[2]);
    if (y > 2400) y -= 543;
    return new Date(y, m, d);
  };

  const formatDate = (date: Date): string => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear() + 543;
    return `${d}/${m}/${y}`;
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ไม่ได้รับอนุญาต', 'กรุณาอนุญาตให้เข้าถึงรูปภาพในการตั้งค่า');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);
      setPhotos(prev => [...prev, ...newUris]);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ไม่ได้รับอนุญาต', 'กรุณาอนุญาตให้เข้าถึงกล้องในการตั้งค่า');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleDeletePhoto = (uri: string) => {
    Alert.alert('ลบรูป', 'ต้องการลบรูปนี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => setPhotos(prev => prev.filter(p => p !== uri)) }
    ]);
  };

  if (!outfit) return <View style={styles.center}><Text>ไม่พบข้อมูลชุด</Text></View>;

  const renderNumInput = (label: string, field: string) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={measurements[field] || ''}
        onChangeText={(val) => updateField(field, val)}
        keyboardType="numeric"
        placeholder="-"
        placeholderTextColor="#ccc"
      />
    </View>
  );

  const renderDateInput = (
    label: string,
    field: string,
    showPicker: boolean,
    setShowPicker: (v: boolean) => void
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)}>
        <Text style={[styles.dateBtnText, !measurements[field] && { color: '#ccc' }]}>
          {measurements[field] || 'เลือกวันที่'}
        </Text>
        <Feather name="calendar" size={16} color="#8F9779" />
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={parseDate(measurements[field])}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowPicker(false);
            if (date) updateField(field, formatDate(date));
          }}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>

      {/* แถบสถานะ */}
      <View style={styles.statusContainer}>
        {(['รอดำเนินการ', 'กำลังทำ', 'เสร็จสิ้น'] as OutfitStatus[]).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.statusBtn, outfit.status === status && styles.statusActive]}
            onPress={() => updateOutfitStatus(outfitId, status)}
          >
            <Text style={[styles.statusBtnText, outfit.status === status && { color: 'white' }]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ===== การเงิน ===== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 การเงิน</Text>
          <View style={styles.row}>
            {renderNumInput('ราคา (บาท)', 'price')}
            {renderNumInput('มัดจำ (บาท)', 'deposit')}
          </View>
          <View style={styles.row}>
            {renderNumInput('ค้างชำระ (บาท)', 'remaining')}
            <View style={styles.inputGroup} />
          </View>
          <View style={styles.row}>
            {renderDateInput('วันสั่งตัด', 'orderDate', showOrderPicker, setShowOrderPicker)}
            {renderDateInput('วันส่งของ', 'deliveryDate', showDeliveryPicker, setShowDeliveryPicker)}
          </View>
        </View>

        {/* ===== แบบชุด ===== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👗 แบบชุด</Text>
          <View style={styles.styleGrid}>
            {OUTFIT_STYLES.map((style) => (
              <TouchableOpacity
                key={style}
                style={[styles.styleChip, measurements['outfitStyle'] === style && styles.styleChipActive]}
                onPress={() => updateField('outfitStyle', measurements['outfitStyle'] === style ? '' : style)}
              >
                <Text style={[styles.styleChipText, measurements['outfitStyle'] === style && styles.styleChipTextActive]}>
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ marginTop: 4 }}>
            <Text style={styles.label}>หมายเหตุแบบชุด</Text>
            <TextInput
              style={styles.input}
              value={measurements['styleNote'] || ''}
              onChangeText={(val) => updateField('styleNote', val)}
              placeholder="รายละเอียดเพิ่มเติม..."
              placeholderTextColor="#ccc"
            />
          </View>
        </View>

        {/* ===== ท่อนบน ===== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👔 ท่อนบน (นิ้ว)</Text>
          <View style={styles.row}>{renderNumInput('รอบคอ', 'neck')}{renderNumInput('ไหล่กว้าง', 'shoulder')}</View>
          <View style={styles.row}>{renderNumInput('บ่าหน้า', 'frontShoulder')}{renderNumInput('บ่าหลัง', 'backShoulder')}</View>
          <View style={styles.row}>{renderNumInput('รอบอก', 'chest')}{renderNumInput('อกห่าง', 'bustSpan')}</View>
          <View style={styles.row}>{renderNumInput('อกสูง', 'bustHeight')}{renderNumInput('รอบเอว (บน)', 'topWaist')}</View>
          <View style={styles.row}>{renderNumInput('ยาวหน้า', 'frontLength')}{renderNumInput('ยาวหลัง', 'backLength')}</View>
          <View style={styles.row}>{renderNumInput('รอบรักแร้', 'armhole')}{renderNumInput('รอบต้นแขน', 'upperArm')}</View>
          <View style={styles.row}>{renderNumInput('ความยาวแขน', 'sleeveLength')}{renderNumInput('รอบข้อมือ', 'wrist')}</View>
          <View style={styles.row}>{renderNumInput('ความยาวเสื้อ', 'shirtLength')}<View style={styles.inputGroup} /></View>
        </View>

        {/* ===== ท่อนล่าง ===== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👖 ท่อนล่าง (นิ้ว)</Text>
          <View style={styles.row}>{renderNumInput('รอบเอว (ล่าง)', 'bottomWaist')}{renderNumInput('สะโพกบน', 'upperHips')}</View>
          <View style={styles.row}>{renderNumInput('สะโพกล่าง', 'lowerHips')}{renderNumInput('ความยาวเป้า', 'crotch')}</View>
          <View style={styles.row}>{renderNumInput('รอบต้นขา', 'thigh')}{renderNumInput('รอบปลายขา', 'legOpening')}</View>
          <View style={styles.row}>{renderNumInput('ความยาว', 'bottomLength')}<View style={styles.inputGroup} /></View>
        </View>

        {/* ===== รูปภาพ ===== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📷 รูปภาพ</Text>
          <View style={styles.photoButtonRow}>
            <TouchableOpacity style={styles.photoBtn} onPress={handlePickImage}>
              <Feather name="image" size={18} color="#8F9779" />
              <Text style={styles.photoBtnText}>เลือกจากคลัง</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto}>
              <Feather name="camera" size={18} color="#8F9779" />
              <Text style={styles.photoBtnText}>ถ่ายรูป</Text>
            </TouchableOpacity>
          </View>
          {photos.length > 0 ? (
            <View style={styles.photoGrid}>
              {photos.map((uri, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri }} style={styles.photo} />
                  <TouchableOpacity style={styles.photoDeleteBtn} onPress={() => handleDeletePhoto(uri)}>
                    <Feather name="x" size={12} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.photoEmpty}>
              <Feather name="image" size={32} color="#d1d1cc" />
              <Text style={styles.photoEmptyText}>ยังไม่มีรูปภาพ</Text>
            </View>
          )}
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>💾 บันทึกข้อมูลทั้งหมด</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusContainer: { flexDirection: 'row', padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee' },
  statusBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, marginHorizontal: 2, backgroundColor: '#f4f5f2' },
  statusActive: { backgroundColor: '#8F9779' },
  statusBtnText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  card: { backgroundColor: 'white', margin: 15, marginBottom: 5, padding: 20, borderRadius: 16, elevation: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#8F9779', marginBottom: 15, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 10 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  inputGroup: { flex: 1 },
  label: { fontSize: 11, color: '#888', marginBottom: 4 },
  input: { backgroundColor: '#f4f5f2', padding: 11, borderRadius: 10, fontSize: 15, color: '#333' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f4f5f2', padding: 11, borderRadius: 10 },
  dateBtnText: { fontSize: 14, color: '#333' },
  styleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  styleChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f4f5f2', borderWidth: 1, borderColor: '#e5e5e0' },
  styleChipActive: { backgroundColor: '#8F9779', borderColor: '#8F9779' },
  styleChipText: { fontSize: 13, color: '#555' },
  styleChipTextActive: { color: 'white', fontWeight: 'bold' },
  photoButtonRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f4f5f2', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e5e0' },
  photoBtnText: { fontSize: 13, color: '#8F9779', fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoWrapper: { position: 'relative' },
  photo: { width: 90, height: 90, borderRadius: 10 },
  photoDeleteBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ff4d4f', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  photoEmpty: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  photoEmptyText: { fontSize: 13, color: '#bbb' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderColor: '#eee' },
  saveBtn: { backgroundColor: '#8F9779', padding: 15, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});