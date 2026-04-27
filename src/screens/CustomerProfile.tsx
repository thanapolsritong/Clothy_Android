import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, FlatList, 
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTailorStore } from '../store';

export default function CustomerProfile({ route, navigation }: any) {
  const { id } = route.params; 
  // ✅ แก้: เพิ่ม deleteOutfit และลบ deleteCustomer (ไม่ใช้ในหน้านี้)
  const { customers, outfits, addOutfit, deleteOutfit } = useTailorStore();
  
  const customer = customers.find(c => c.id === id);
  const customerOutfits = outfits.filter(o => o.customerId === id);

  const [modalVisible, setModalVisible] = useState(false);
  const [outfitName, setOutfitName] = useState('');

  const handleAddOutfit = () => {
    if (outfitName.trim()) {
      const newOutfitId = addOutfit(id, outfitName);
      setModalVisible(false);
      setOutfitName('');
      navigation.navigate('OutfitDetail', { outfitId: newOutfitId });
    }
  };

  if (!customer) return <View style={styles.center}><Text>ไม่พบข้อมูลลูกค้า</Text></View>;

  return (
    <View style={styles.container}>
      {/* โปรไฟล์ลูกค้า */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{customer.name.charAt(0)}</Text>
        </View>
        <View>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.info}><Feather name="phone" size={12}/> {customer.phone}</Text>
          {customer.dept ? <Text style={styles.info}><Feather name="briefcase" size={12}/> {customer.dept}</Text> : null}
        </View>
      </View>

      <Text style={styles.sectionTitle}>รายการชุดสั่งตัด ({customerOutfits.length})</Text>

      {/* ✅ แก้: renderItem ถูกต้องแล้ว ปุ่มลบอยู่ในการ์ดเดียวกัน */}
      <FlatList
        data={customerOutfits}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.outfitCard}>
            <TouchableOpacity 
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('OutfitDetail', { outfitId: item.id })}
            >
              <Text style={styles.outfitName}>{item.name}</Text>
              <View style={[styles.statusBadge, item.status === 'เสร็จสิ้น' ? styles.statusDone : styles.statusWait]}>
                <Text style={[styles.statusText, item.status === 'เสร็จสิ้น' && { color: '#059669' }]}>
                  {item.status}
                </Text>
              </View>
            </TouchableOpacity>

            {/* ✅ แก้: ปุ่มลบชุด พร้อม Alert confirm และเรียก deleteOutfit (ไม่ใช่ deleteCustomer) */}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => Alert.alert(
                'ลบชุด',
                `ต้องการลบ "${item.name}" ออกจากระบบ?`,
                [
                  { text: 'ยกเลิก', style: 'cancel' },
                  { text: 'ลบ', style: 'destructive', onPress: () => deleteOutfit(item.id) }
                ]
              )}
            >
              <Feather name="trash-2" size={18} color="#ff4d4f" />
            </TouchableOpacity>

            <Feather name="chevron-right" size={24} color="#ccc" />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>ยังไม่มีรายการสั่งตัด</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Feather name="plus" size={28} color="white" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ตั้งชื่อชุดใหม่</Text>
            <TextInput 
              style={styles.input} 
              placeholder="เช่น ชุดสูทสีดำ, ชุดข้าราชการ" 
              value={outfitName} 
              onChangeText={setOutfitName} 
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#ccc' }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { flex: 2, backgroundColor: '#8F9779' }]} onPress={handleAddOutfit}>
                <Text style={styles.btnText}>สร้างชุด</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F6', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileCard: { flexDirection: 'row', backgroundColor: 'white', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 20, elevation: 2 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f0f2eb', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#8F9779' },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  info: { fontSize: 14, color: '#666', marginBottom: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  // ✅ แก้: outfitCard เป็น View ไม่ใช่ TouchableOpacity แล้ว
  outfitCard: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', elevation: 1 },
  outfitName: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusWait: { backgroundColor: '#fef3c7' },
  statusDone: { backgroundColor: '#d1fae5' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#d97706' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
  // ✅ เพิ่ม style ปุ่มลบ
  deleteBtn: { padding: 8, marginRight: 4 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#8F9779', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 25, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: '#f4f5f2', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  btn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' }
});