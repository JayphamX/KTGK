import React, { useState } from 'react';
import { ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useStore, saveDish } from '../store';
import { useT } from '../i18n';
import { Btn, Chip, colors, s } from '../ui';

export default function DishFormScreen({ route, navigation }) {
  const { t } = useT();
  const { dishes, categories } = useStore();
  const id = route.params?.id;
  const dish = id ? dishes.find((d) => d.id === id) : null;

  const [form, setForm] = useState({
    name: dish?.name ?? '',
    price: dish ? String(dish.price) : '',
    preparationTime: dish ? String(dish.preparationTime) : '',
    description: dish?.description ?? '',
    isAvailable: dish ? dish.isAvailable : true,
    categoryId: dish?.categoryId ?? '',
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (id && !dish) {
    return (
      <View style={s.center}>
        <Text style={{ marginBottom: 12 }}>{t('dishNotFound')}</Text>
        <Btn title={t('back')} onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const onSave = () => {
    const r = saveDish(form, id);
    if (r.ok) navigation.goBack();
    else setErrors(r.errors);
  };
  const Err = ({ k }) => (errors[k] ? <Text style={s.err}>{t(errors[k])}</Text> : null);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 14 }} keyboardShouldPersistTaps="handled">
      <Text style={s.label}>{t('name')}</Text>
      <TextInput style={s.input} value={form.name} onChangeText={(v) => set('name', v)} />
      <Err k="name" />

      <Text style={s.label}>{t('price')}</Text>
      <TextInput style={s.input} value={form.price} keyboardType="numeric" onChangeText={(v) => set('price', v)} />
      <Err k="price" />

      <Text style={s.label}>{t('prepTime')}</Text>
      <TextInput style={s.input} value={form.preparationTime} keyboardType="numeric" onChangeText={(v) => set('preparationTime', v)} />
      <Err k="preparationTime" />

      <Text style={s.label}>{t('category')}</Text>
      {categories.length === 0 ? (
        <Text style={{ color: colors.muted }}>{t('noCategories')}</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {categories.map((c) => (
            <View key={c.id} style={{ marginBottom: 8 }}>
              <Chip label={c.name} active={form.categoryId === c.id} onPress={() => set('categoryId', c.id)} />
            </View>
          ))}
        </View>
      )}
      <Err k="categoryId" />

      <Text style={s.label}>{t('description')}</Text>
      <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} multiline value={form.description} onChangeText={(v) => set('description', v)} />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
        <Switch value={form.isAvailable} onValueChange={(v) => set('isAvailable', v)} trackColor={{ true: colors.primary }} />
        <Text style={{ marginLeft: 8 }}>{t('available')}</Text>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 24 }}>
        <Btn title={t('save')} onPress={onSave} style={{ flex: 1, marginRight: 8 }} />
        <Btn title={t('cancel')} kind="ghost" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}
