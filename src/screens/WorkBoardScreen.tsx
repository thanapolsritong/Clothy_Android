import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTailorStore, OutfitStatus } from '../store';

export default function WorkBoardScreen({ navigation }: any) {
  const { outfits, customers } = useTailorStore();
  
  // ลิสต์สถานะทั้งหมดที่เรามี
  const statuses: { title: OutfitStatus; color: string; bgColor: string }[] = [
    { title: 'รอดำเนินการ', color: '#d97706', bgColor: '#fef3c7' }, // สีเหลือง
    { title: 'กำลังทำ', color: '#2563eb', bgColor: '#dbeafe' },     // สีฟ้า
    { title: 'เสร็จสิ้น', color: '#059669', bgColor: '#d1fae5' }      // สีเขียว
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        
        {statuses.map((statusGroup) => {
          // ดึงเฉพาะชุดที่ตรงกับสถานะนั้นๆ
          const filteredOutfits = outfits.filter(o => o.status === statusGroup.title);

          return (
            <View key={statusGroup.title} style={styles.section}>
              {/* หัวข้อสถานะ */}
              <View style={[styles.statusHeader, { backgroundColor: statusGroup.bgColor }]}>
                <Text style={[styles.statusTitle, { color: statusGroup.color }]}>
                  {statusGroup.title} ({filteredOutfits.length} งาน)
                </Text>
              </View>

              {/* รายการชุดในสถานะนั้น */}
              {filteredOutfits.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>ไม่มีงานในสถานะนี้</Text>
                </View>
              ) : (
                filteredOutfits.map(outfit => {
                  // หาชื่อลูกค้าของชุดนี้
                  const customer = customers.find(c => c.id === outfit.customerId);
                  
                  return (
                    <TouchableOpacity 
                      key={outfit.id} 
                      style={styles.card}
                      // กดปุ๊บ วาร์ปไปหน้ารายละเอียดชุดทันที
                      onPress={() => navigation.navigate('OutfitDetail', { outfitId: outfit.id })}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.outfitName}>{outfit.name}</Text>
                        <Text style={styles.customerName}>
                          <Feather name="user" size={12} /> ลูกค้า: {customer?.name || 'ไม่ระบุ'}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={20} color="#ccc" />
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F6' },
  section: { marginBottom: 25 },
  statusHeader: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 15 },
  statusTitle: { fontSize: 16, fontWeight: 'bold' },
  emptyCard: { padding: 20, borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed', borderRadius: 12, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14 },
  card: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  outfitName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  customerName: { fontSize: 13, color: '#666' }
});