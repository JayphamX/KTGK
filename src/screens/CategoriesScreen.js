// Màn hình tối thiểu để thêm/xóa loại món (cần cho ràng buộc "không xóa loại món đang được sử dụng")
import React, { useState } from 'react';
import { Alert, FlatList, Text, TextInput, View } from 'react-native';
import { useStore, createCategory, deleteCategory } from '../store';
import { useT } from '../i18n';
import { Btn, colors, s } from '../ui';

export default function CategoriesScreen() {
  const { t } = useT();
  const { categories } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [err, setErr] = useState('');

  const onAdd = () => {
    const r = createCategory({ name, description });
    if (r.ok) { setName(''); setDescription(''); setErr(''); } else setErr(t(r.error));
  };

  const onDelete = (c) =>
    Alert.alert(t('confirmDeleteTitle'), t('confirmDeleteMsg', { name: c.name }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'), style: 'destructive',
        onPress: () => {
          const r = deleteCategory(c.id);
          if (!r.ok) Alert.alert(t('error'), t(r.error));
        },
      },
    ]);

  const header = (
    <View style={{ padding: 14 }}>
      <Text style={s.label}>{t('name')}</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} />
      {err ? <Text style={s.err}>{err}</Text> : null}
      <Text style={s.label}>{t('description')}</Text>
      <TextInput style={s.input} value={description} onChangeText={setDescription} />
      <Btn title={t('addCategory')} onPress={onAdd} style={{ marginTop: 10 }} />
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={categories}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.muted }}>{t('noCategoryList')}</Text>}
      renderItem={({ item }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 14, marginBottom: 8, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700' }}>{item.name}</Text>
            {item.description ? <Text style={{ color: colors.muted }}>{item.description}</Text> : null}
          </View>
          <Btn title={t('delete')} kind="danger" onPress={() => onDelete(item)} style={{ paddingVertical: 6 }} />
        </View>
      )}
    />
  );
}
