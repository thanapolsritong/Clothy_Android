import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TextInput,
  TouchableOpacity, Alert, Image, Platform, ActivityIndicator, Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useTailorStore, OutfitStatus } from '../store';

// ⚠️ แนะนำให้ย้าย Key ไปไว้ใน .env แทนการเขียนตรงนี้
const GEMINI_API_KEY = 'AIzaSyBEaD3GcKtOpnhkjWXFkRuzjtGR7XuGTb8';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const OUTFIT_STYLES = [
  'คอปกแขนยาว', 'คอปกแขนสั้น', 'คอกลมแขนยาว', 'คอกลมแขนสั้น',
  'คอวีแขนยาว', 'คอวีแขนสั้น', 'ชุดเดรสแขนยาว', 'ชุดเดรสแขนสั้น',
  'กระโปรงทรงเอ', 'กระโปรงทรงตรง', 'กระโปรงบาน',
  'กางเกงขายาว', 'กางเกงขาม้า', 'กางเกงขาสั้น', 'กางเกงทรงกระบอก',
  'ชุดสูท', 'ชุดข้าราชการ', 'อื่นๆ'
];

const FIELD_LABELS: Record<string, string> = {
  price: 'ราคา (บาท)', deposit: 'มัดจำ (บาท)', remaining: 'ค้างชำระ (บาท)', quantity: 'จำนวนชุด',
  neck: 'รอบคอ', shoulder: 'ไหล่กว้าง', frontShoulder: 'บ่าหน้า', backShoulder: 'บ่าหลัง',
  chest: 'รอบอก', bustSpan: 'อกห่าง', bustHeight: 'อกสูง', topWaist: 'รอบเอว (บน)',
  frontLength: 'ยาวหน้า', backLength: 'ยาวหลัง', armhole: 'รอบรักแร้', upperArm: 'รอบต้นแขน',
  sleeveLength: 'ความยาวแขน', wrist: 'รอบข้อมือ', shirtLength: 'ความยาวเสื้อ',
  bottomWaist: 'รอบเอว (ล่าง)', upperHips: 'สะโพกบน', lowerHips: 'สะโพกล่าง',
  crotch: 'ความยาวเป้า', thigh: 'รอบต้นขา', legOpening: 'รอบปลายขา', bottomLength: 'ความยาว'
};

export default function OutfitDetail({ route }: any) {
  const { outfitId } = route.params;
  const { outfits, updateMeasurements, updateOutfitStatus } = useTailorStore();
  const outfit = outfits.find(o => o.id === outfitId);

  const [measurements, setMeasurements] = useState<any>(outfit?.measurements || {});
  const [photos, setPhotos] = useState<string[]>(outfit?.measurements?.photos || []);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [scannedData, setScannedData] = useState<Record<string, string>>({});

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
    let y = parseInt(parts[2]);
    if (y > 2400) y -= 543;
    return new Date(y, parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  const formatDate = (date: Date): string => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear() + 543;
    return `${d}/${m}/${y}`;
  };

  // ===== สแกนกระดาษด้วย Gemini Vision =====
  const handleScanPaper = () => {
    Alert.alert('สแกนกระดาษสัดส่วน', 'เลือกรูปจากไหน?', [
      { text: 'ถ่ายรูป', onPress: scanFromCamera },
      { text: 'เลือกจากคลัง', onPress: scanFromGallery },
      { text: 'ยกเลิก', style: 'cancel' }
    ]);
  };

  const scanFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('ไม่ได้รับอนุญาต', 'กรุณาอนุญาตให้เข้าถึงกล้อง'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true });
    if (!result.canceled && result.assets[0].base64) await processScannedImage(result.assets[0].base64);
  };

  const scanFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('ไม่ได้รับอนุญาต', 'กรุณาอนุญาตให้เข้าถึงรูปภาพ'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, base64: true });
    if (!result.canceled && result.assets[0].base64) await processScannedImage(result.assets[0].base64);
  };

  const processScannedImage = async (base64: string) => {
    setIsScanning(true);
    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64
                }
              },
              {
                text: `อ่านสัดส่วนจากกระดาษในรูปนี้ แล้วตอบเป็น JSON เท่านั้น ห้ามมีข้อความอื่น ห้ามมี backtick
ใช้ field เหล่านี้ตามที่พบในกระดาษ (ถ้าไม่มีให้ข้ามไป):
price=ราคา, deposit=มัดจำ, remaining=ค้างชำระ, quantity=จำนวนชุด,
neck=รอบคอ, shoulder=ไหล่/ไหล่กว้าง, frontShoulder=บ่าหน้า, backShoulder=บ่าหลัง,
chest=รอบอก, bustSpan=อกห่าง, bustHeight=อกสูง, topWaist=รอบเอวบน/เอว,
frontLength=ยาวหน้า, backLength=ยาวหลัง, armhole=รักแร้/รอบรักแร้,
upperArm=รอบต้นแขน, sleeveLength=แขนยาว/ความยาวแขน, wrist=แขนกว้าง/รอบข้อมือ,
shirtLength=เสื้อยาว/ความยาวเสื้อ, bottomWaist=รอบเอวล่าง,
upperHips=สะโพกเล็ก/สะโพกบน, lowerHips=สะโพกใหญ่/สะโพกล่าง,
crotch=เป้า/เป้ากางเกง, thigh=รอบต้นขา, legOpening=ปลายขา, bottomLength=กระโปรงยาว/กางเกงยาว
ตัวอย่าง: {"chest":"36","topWaist":"28","backLength":"15"}`
              }
            ]
          }],
          generationConfig: { temperature: 0.1 }
        })
      });

      const data = await response.json();

      // ดึง text จาก Gemini response
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      if (!text) {
        Alert.alert('อ่านไม่ได้', 'Gemini ไม่สามารถอ่านรูปนี้ได้ กรุณาถ่ายให้ชัดขึ้น');
        return;
      }

      try {
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        const filled = Object.fromEntries(
          Object.entries(parsed).filter(([_, v]) => v && String(v).trim() !== '')
        ) as Record<string, string>;

        if (Object.keys(filled).length === 0) {
          Alert.alert('อ่านไม่ได้', 'ไม่พบข้อมูลสัดส่วนในรูป กรุณาถ่ายให้ชัดขึ้น');
          return;
        }

        setScannedData(filled);
        setScanModalVisible(true);

      } catch {
        Alert.alert('เกิดข้อผิดพลาด', `แปลงข้อมูลไม่ได้\nGemini ตอบว่า: ${text.substring(0, 100)}`);
      }

    } catch (err) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อ Gemini ได้ กรุณาตรวจสอบอินเทอร์เน็ตและ API Key');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmScan = () => {
    setMeasurements((prev: any) => ({ ...prev, ...scannedData }));
    setScanModalVisible(false);
    Alert.alert('สำเร็จ', `กรอกข้อมูล ${Object.keys(scannedData).length} รายการเรียบร้อยแล้ว`);
  };

  // ===== รูปภาพ =====
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('ไม่ได้รับอนุญาต', 'กรุณาอนุญาตให้เข้าถึงรูปภาพ'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.7 });
    if (!result.canceled) setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)]);
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('ไม่ได้รับอนุญาต', 'กรุณาอนุญาตให้เข้าถึงกล้อง'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setPhotos(prev => [...prev, result.assets[0].uri]);
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

  const renderDateInput = (label: string, field: string, showPicker: boolean, setShowPicker: (v: boolean) => void) => (
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
          onChange={(_, date) => { setShowPicker(false); if (date) updateField(field, formatDate(date)); }}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>

      {/* แถบสถานะ */}
      <View style={styles.statusContainer}>
        {(['รอดำเนินการ', 'กำลังทำ', 'เสร็จสิ้น'] as OutfitStatus[]).map((status) => (
          <TouchableOpacity key={status} style={[styles.statusBtn, outfit.status === status && styles.statusActive]} onPress={() => updateOutfitStatus(outfitId, status)}>
            <Text style={[styles.statusBtnText, outfit.status === status && { color: 'white' }]}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ปุ่มสแกน */}
        <TouchableOpacity style={styles.scanBtn} onPress={handleScanPaper} disabled={isScanning}>
          {isScanning ? (
            <View style={styles.scanBtnInner}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.scanBtnText}>กำลังอ่านข้อมูล...</Text>
            </View>
          ) : (
            <View style={styles.scanBtnInner}>
              <Feather name="camera" size={20} color="white" />
              <Text style={styles.scanBtnText}>📋 สแกนกระดาษสัดส่วน</Text>
              <Text style={styles.scanBtnSub}>ถ่ายรูปกระดาษ AI จะกรอกให้อัตโนมัติ</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* การเงิน */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 การเงิน</Text>
          <View style={styles.row}>
            {renderNumInput('ราคา (บาท)', 'price')}
            {renderNumInput('จำนวนชุด', 'quantity')}
          </View>
          <View style={styles.row}>
            {renderNumInput('มัดจำ (บาท)', 'deposit')}
            {renderNumInput('ค้างชำระ (บาท)', 'remaining')}
          </View>
          <View style={styles.row}>
            {renderDateInput('วันสั่งตัด', 'orderDate', showOrderPicker, setShowOrderPicker)}
            {renderDateInput('วันส่งของ', 'deliveryDate', showDeliveryPicker, setShowDeliveryPicker)}
          </View>
        </View>

        {/* แบบชุด */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👗 แบบชุด</Text>
          <View style={styles.styleGrid}>
            {OUTFIT_STYLES.map((style) => (
              <TouchableOpacity key={style} style={[styles.styleChip, measurements['outfitStyle'] === style && styles.styleChipActive]} onPress={() => updateField('outfitStyle', measurements['outfitStyle'] === style ? '' : style)}>
                <Text style={[styles.styleChipText, measurements['outfitStyle'] === style && styles.styleChipTextActive]}>{style}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>หมายเหตุแบบชุด</Text>
          <TextInput style={styles.input} value={measurements['styleNote'] || ''} onChangeText={(val) => updateField('styleNote', val)} placeholder="รายละเอียดเพิ่มเติม..." placeholderTextColor="#ccc" />
        </View>

        {/* ท่อนบน */}
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

        {/* ท่อนล่าง */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👖 ท่อนล่าง (นิ้ว)</Text>
          <View style={styles.row}>{renderNumInput('รอบเอว (ล่าง)', 'bottomWaist')}{renderNumInput('สะโพกบน', 'upperHips')}</View>
          <View style={styles.row}>{renderNumInput('สะโพกล่าง', 'lowerHips')}{renderNumInput('ความยาวเป้า', 'crotch')}</View>
          <View style={styles.row}>{renderNumInput('รอบต้นขา', 'thigh')}{renderNumInput('รอบปลายขา', 'legOpening')}</View>
          <View style={styles.row}>{renderNumInput('ความยาว', 'bottomLength')}<View style={styles.inputGroup} /></View>
        </View>

        {/* รูปภาพ */}
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

      {/* ปุ่มบันทึก */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>💾 บันทึกข้อมูลทั้งหมด</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Preview ผลสแกน */}
      <Modal visible={scanModalVisible} animationType="slide" transparent onRequestClose={() => setScanModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>ผลการสแกน ({Object.keys(scannedData).length} รายการ)</Text>
                <Text style={styles.modalSub}>แก้ไขได้ก่อนกดใช้งาน</Text>
              </View>
              <TouchableOpacity onPress={() => setScanModalVisible(false)}>
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {Object.entries(scannedData).map(([field, value]) => (
                <View key={field} style={styles.scanRow}>
                  <Text style={styles.scanLabel}>{FIELD_LABELS[field] || field}</Text>
                  <TextInput
                    style={styles.scanInput}
                    value={String(value)}
                    onChangeText={(val) => setScannedData(prev => ({ ...prev, [field]: val }))}
                    keyboardType="numeric"
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setScanModalVisible(false)}>
                <Text style={styles.modalCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmScan}>
                <Feather name="check" size={18} color="white" />
                <Text style={styles.modalConfirmText}>ใช้ข้อมูลนี้</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  scanBtn: { margin: 15, marginBottom: 5, backgroundColor: '#8F9779', borderRadius: 16, padding: 18, elevation: 3 },
  scanBtnInner: { alignItems: 'center', gap: 4 },
  scanBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  scanBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
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
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalSub: { fontSize: 12, color: '#999', marginTop: 2 },
  scanRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f4f4f4' },
  scanLabel: { fontSize: 14, color: '#555', flex: 1 },
  scanInput: { backgroundColor: '#f4f5f2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, fontSize: 15, color: '#333', minWidth: 80, textAlign: 'right' },
  modalFooterRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  modalCancelText: { fontSize: 15, color: '#666', fontWeight: '600' },
  modalConfirmBtn: { flex: 2, flexDirection: 'row', padding: 14, borderRadius: 12, backgroundColor: '#8F9779', alignItems: 'center', justifyContent: 'center', gap: 6 },
  modalConfirmText: { fontSize: 15, color: 'white', fontWeight: 'bold' },
});