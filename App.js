import React, { useEffect } from 'react';
import { ActivityIndicator, TouchableOpacity, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider, useT } from './src/i18n';
import { init, useStore } from './src/store';
import { PROJECT_NAME } from './src/config';
import { Banner, colors } from './src/ui';
import DishListScreen from './src/screens/DishListScreen';
import DishDetailScreen from './src/screens/DishDetailScreen';
import DishFormScreen from './src/screens/DishFormScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';

const Stack = createNativeStackNavigator();

function Root() {
  const { t, lang, setLang } = useT();
  const { ready } = useStore();
  useEffect(() => { init(); }, []);

  if (!ready) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  }

  // Nút chuyển ngôn ngữ EN <-> VI ở header mọi màn hình
  const langButton = () => (
    <TouchableOpacity onPress={() => setLang(lang === 'en' ? 'vi' : 'en')}>
      <Text style={{ fontWeight: '700', color: colors.primary }}>{lang === 'en' ? 'EN | vi' : 'en | VI'}</Text>
    </TouchableOpacity>
  );

  return (
    <NavigationContainer>
      <Banner />
      <Stack.Navigator screenOptions={{ headerRight: langButton }}>
        <Stack.Screen name="DishList" component={DishListScreen} options={{ title: PROJECT_NAME }} />
        <Stack.Screen name="DishDetail" component={DishDetailScreen} options={{ title: t('dishDetail') }} />
        <Stack.Screen name="DishForm" component={DishFormScreen} options={({ route }) => ({ title: route.params?.id ? t('editDish') : t('addDish') })} />
        <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: t('categories') }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <Root />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
