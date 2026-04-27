import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type OutfitStatus = 'รอดำเนินการ' | 'กำลังทำ' | 'เสร็จสิ้น';

export interface Customer { 
  id: string; name: string; phone: string; dept?: string; address?: string; 
}
export interface Photo { 
  id: string; url: string; caption: string; 
}
export interface Outfit { 
  id: string; customerId: string; name: string; status: OutfitStatus; measurements: any; photos: Photo[]; 
}

// ⚠️ เพิ่มการประกาศชื่อฟังก์ชันให้ครบที่นี่ TypeScript จะได้ไม่งอแง
interface TailorStore {
  customers: Customer[];
  outfits: Outfit[];
  
  // จัดการลูกค้า
  addCustomer: (name: string, phone: string, dept: string, address: string) => void;
  deleteCustomer: (id: string) => void;
  renameCustomer: (id: string, newName: string) => void;

  // จัดการชุด
  addOutfit: (customerId: string, name: string) => string;
  deleteOutfit: (outfitId: string) => void;
  renameOutfit: (outfitId: string, newName: string) => void;
  updateMeasurements: (outfitId: string, data: any) => void;
  updateOutfitStatus: (outfitId: string, status: OutfitStatus) => void;
}

export const useTailorStore = create<TailorStore>()(
  persist(
    (set, get) => ({
      customers: [], 
      outfits: [],   

      // ===========================
      // ส่วนของลูกค้า
      // ===========================
      addCustomer: (name, phone, dept, address) => {
        const newCustomer = { 
          id: 'c' + Date.now().toString(), 
          name, phone, dept, address 
        };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter(c => c.id !== id),
          outfits: state.outfits.filter(o => o.customerId !== id) // ลบชุดของลูกค้าคนนี้ทิ้งด้วย
        }));
      },

      // ===========================
      // ส่วนของชุดสั่งตัด
      // ===========================
      addOutfit: (customerId, name) => {
        const newOutfitId = 'o' + Date.now().toString();
        const newOutfit: Outfit = {
          id: newOutfitId, customerId, name, status: 'รอดำเนินการ', measurements: {}, photos: []
        };
        set((state) => ({ outfits: [...state.outfits, newOutfit] }));
        return newOutfitId;
      },

      deleteOutfit: (outfitId) => {
        set((state) => ({
          outfits: state.outfits.filter(o => o.id !== outfitId)
        }));
      },

      updateMeasurements: (outfitId, data) => {
        set((state) => ({
          outfits: state.outfits.map(o => o.id === outfitId ? { ...o, measurements: data } : o)
        }));
      },

      updateOutfitStatus: (outfitId, status) => {
        set((state) => ({
          outfits: state.outfits.map(o => o.id === outfitId ? { ...o, status } : o)
        }));
      },

      renameCustomer: (id, newName) => {
        set(state => ({
          customers: state.customers.map(c => c.id === id ? { ...c, name: newName } : c)
        }));
      },
      
      renameOutfit: (outfitId, newName) => {
        set(state => ({
          outfits: state.outfits.map(o => o.id === outfitId ? { ...o, name: newName } : o)
        }));
      },

    }),
    {
      name: 'clothy-offline-storage', 
      storage: createJSONStorage(() => AsyncStorage), 
    }
  )
);