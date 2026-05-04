import React, { useState } from 'react';
import {
  Text, View, TextInput, TouchableOpacity,
  FlatList, Modal, KeyboardAvoidingView,
  Platform, ScrollView, Alert, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTailorStore } from '../store';

export default function HomeScreen({ navigation }: any) {
  const { customers, outfits, addCustomer, deleteCustomer } = useTailorStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dept, setDept] = useState('');
  const [address, setAddress] = useState('');

  // ===== ค้นหาลูกค้า =====
  const [searchQuery, setSearchQuery] = useState('');
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.dept || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = () => {
    if (name.trim() && phone.trim()) {
      addCustomer(name, phone, dept, address);
      setName(''); setPhone(''); setDept(''); setAddress('');
      setModalVisible(false);
    } else {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและเบอร์โทรศัพท์');
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Clothy</Text>
          <Text style={styles.headerSubtitle}>จัดการลูกค้าและงานตัดชุด</Text>
        </View>
        <TouchableOpacity style={styles.boardButton} onPress={() => navigation.navigate('WorkBoard')}>
          <Feather name="trello" size={20} color="#8F9779" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{customers.length}</Text>
          <Text style={styles.statLabel}>ลูกค้าทั้งหมด</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{outfits.length}</Text>
          <Text style={styles.statLabel}>งานในระบบ</Text>
        </View>
      </View>

      {/* ===== ช่องค้นหา ===== */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาชื่อ, เบอร์โทร, แผนก..."
          placeholderTextColor="#bbb"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x-circle" size={18} color="#bbb" />
          </TouchableOpacity>
        )}
      </View>

      {/* รายชื่อลูกค้า */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `ผลการค้นหา (${filteredCustomers.length})` : 'รายชื่อลูกค้า'}
          </Text>
        </View>

        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.customerIconCard}
              onPress={() => navigation.navigate('CustomerProfile', { id: item.id })}
            >
              <TouchableOpacity
                style={styles.deleteMiniBtn}
                onPress={() => Alert.alert(
                  'ลบลูกค้า',
                  `ต้องการลบ "${item.name}" ออกจากระบบ?\nชุดทั้งหมดจะหายไปด้วย`,
                  [
                    { text: 'ยกเลิก', style: 'cancel' },
                    { text: 'ลบ', style: 'destructive', onPress: () => deleteCustomer(item.id) }
                  ]
                )}
              >
                <Feather name="x" size={12} color="white" />
              </TouchableOpacity>

              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <Text style={styles.customerName} numberOfLines={1}>{item.name}</Text>
              {item.dept
                ? <Text style={styles.deptTag} numberOfLines={1}>{item.dept}</Text>
                : <Text style={styles.customerPhone}>{item.phone}</Text>
              }
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name={searchQuery ? 'search' : 'users'} size={48} color="#d1d1cc" />
              <Text style={styles.emptyStateText}>
                {searchQuery ? `ไม่พบ "${searchQuery}"` : 'ยังไม่มีรายชื่อลูกค้า'}
              </Text>
              <Text style={styles.emptyStateSub}>
                {searchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'กดปุ่ม + เพื่อเพิ่มข้อมูล'}
              </Text>
            </View>
          }
        />
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Feather name="plus" size={28} color="white" />
      </TouchableOpacity>

      {/* Modal เพิ่มลูกค้า */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ลงทะเบียนลูกค้า</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>ข้อมูลพื้นฐาน (จำเป็น)</Text>
                <TextInput style={styles.input} placeholder="ชื่อ-นามสกุล *" value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="เบอร์โทรศัพท์ *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <Text style={[styles.inputLabel, { marginTop: 10 }]}>ข้อมูลเพิ่มเติม (ไม่บังคับ)</Text>
                <TextInput style={styles.input} placeholder="แผนก/หน่วยงาน" value={dept} onChangeText={setDept} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="สถานที่จัดส่ง/ที่อยู่" value={address} onChangeText={setAddress} multiline numberOfLines={3} />
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>บันทึกลูกค้า</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#8F9779' },
  headerSubtitle: { fontSize: 14, color: '#888' },
  boardButton: { backgroundColor: '#f0f2eb', padding: 12, borderRadius: 12 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 15 },
  statBox: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 16, elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#666' },

  // ช่องค้นหา
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 20, marginBottom: 15, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, elevation: 1, gap: 8 },
  searchIcon: { marginRight: 2 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },

  listContainer: { flex: 1, paddingHorizontal: 20 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  row: { justifyContent: 'flex-start', gap: 12, marginBottom: 15 },
  customerIconCard: { width: '31%', backgroundColor: 'white', paddingVertical: 15, borderRadius: 16, alignItems: 'center', elevation: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f0f2eb', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#8F9779' },
  customerName: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  customerPhone: { fontSize: 10, color: '#999', marginTop: 2 },
  deptTag: { fontSize: 10, color: '#8F9779', marginTop: 2, fontWeight: '500' },
  deleteMiniBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#ff4d4f', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyStateText: { fontSize: 16, fontWeight: 'bold', color: '#666', marginTop: 10 },
  emptyStateSub: { fontSize: 14, color: '#999' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#8F9779', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  formGroup: { marginBottom: 5 },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#8F9779', marginBottom: 8 },
  input: { backgroundColor: '#f4f5f2', padding: 15, borderRadius: 12, marginBottom: 12, fontSize: 15 },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveButton: { backgroundColor: '#8F9779', padding: 16, borderRadius: 14, alignItems: 'center', marginVertical: 10 },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});