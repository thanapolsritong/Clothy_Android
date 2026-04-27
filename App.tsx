import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// นำเข้าหน้าจอต่างๆ
import HomeScreen from './src/screens/HomeScreen';
import CustomerProfile from './src/screens/CustomerProfile';
import OutfitDetail from './src/screens/OutfitDetail';
import WorkBoardScreen from './src/screens/WorkBoardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{ 
          headerShown: true, // เปิดให้โชว์แถบด้านบน
          headerStyle: { backgroundColor: '#F9F8F6' },
          headerShadowVisible: false,
          headerTintColor: '#8F9779',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} // หน้าแรกเราทำ Header เองแล้ว เลยซ่อนของระบบไว้
        />
        <Stack.Screen 
          name="CustomerProfile" 
          component={CustomerProfile} 
          options={{ title: 'โปรไฟล์ลูกค้า' }} 
        />
        <Stack.Screen 
          name="OutfitDetail" 
          component={OutfitDetail} 
          options={{ title: 'รายละเอียดชุด' }}
        />
        <Stack.Screen 
          name="WorkBoard" 
          component={WorkBoardScreen} 
          options={{ title: 'กระดานงานทั้งหมด' }} 
          />
      </Stack.Navigator>
    </NavigationContainer>
  );
}