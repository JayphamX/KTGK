import React, { useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, View } from 'react-native';
import { useStore, deleteDish, addImage, setThumbnail } from '../store';
import { useT } from '../i18n';
import { Btn, colors, formatPrice, prepKey, s } from '../ui';

export default function DishDetailScreen({ route, navigation }) {
  const { t } = useT();
  const { dishes, categories } = useStore();
  const [url, setUrl] = useState('');
  const [urlErr, setUrlErr] = useState('');
  const dish = dishes.find((d) => d.id === route.params?.id);

  // Id không tồn tại (đã bị xóa / sai id)
  if (!dish) {
    return (
      <View style={s.center}>
        <Text style={{ marginBottom: 12 }}>{t('dishNotFound')}</Text>
        <Btn title={t('back')} onPress={() => navigation.goBack()} />
      </View>
    );
  }
  const cat = categories.find((c) => c.id === dish.categoryId);

  const confirmDelete = () =>
    Alert.alert(t('confirmDeleteTitle'), t('confirmDeleteMsg', { name: dish.name }), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => { deleteDish(dish.id); navigation.goBack(); } },
    ]);

  const onAddImage = () => {
    const r = addImage(dish.id, url);
    if (r.ok) { setUrl(''); setUrlErr(''); } else setUrlErr(t(r.error));
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 14 }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: 22, fontWeight: '700' }}>{dish.name}</Text>
      <Text style={{ color: colors.muted, marginVertical: 4 }}>{cat?.name ?? '-'}</Text>
      <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '700' }}>{formatPrice(dish.price)}</Text>
      <Text style={{ marginTop: 6 }}>{t('prepTime')}: {dish.preparationTime} {t('minutes')} ({t(prepKey(dish.preparationTime))})</Text>
      <Text style={{ color: dish.isAvailable ? colors.ok : colors.danger, marginTop: 4 }}>{dish.isAvailable ? t('available') : t('unavailable')}</Text>
      {dish.description ? <Text style={{ marginTop: 8 }}>{dish.description}</Text> : null}

      <Text style={s.label}>{t('images')}</Text>
      {dish.images.length === 0 ? (
        <Text style={{ color: colors.muted }}>{t('noImages')}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dish.images.map((im, idx) => (
            <View key={`${im.imageUrl}-${idx}`} style={{ marginRight: 10, width: 200 }}>
              <Image source={{ uri: im.imageUrl }} style={{ width: 200, height: 140, borderRadius: 8, backgroundColor: '#E9ECEF' }} />
              {im.isThumbnail ? (
                <Text style={{ color: colors.ok, fontWeight: '700', marginTop: 4 }}>★ {t('thumbnail')}</Text>
              ) : (
                <Btn title={t('setThumbnail')} kind="ghost" onPress={() => setThumbnail(dish.id, idx)} style={{ marginTop: 4, paddingVertical: 6 }} />
              )}
            </View>
          ))}
        </ScrollView>
      )}

      <Text style={s.label}>{t('imageUrl')}</Text>
      <TextInput style={s.input} value={url} onChangeText={setUrl} autoCapitalize="none" placeholder="https://..." />
      {urlErr ? <Text style={s.err}>{urlErr}</Text> : null}
      <Btn title={t('addImage')} onPress={onAddImage} style={{ marginTop: 8 }} />

      <View style={{ flexDirection: 'row', marginTop: 24 }}>
        <Btn title={t('edit')} onPress={() => navigation.navigate('DishForm', { id: dish.id })} style={{ flex: 1, marginRight: 8 }} />
        <Btn title={t('delete')} kind="danger" onPress={confirmDelete} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}
