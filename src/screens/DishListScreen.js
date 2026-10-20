import React, { useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, Switch, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useStore } from '../store';
import { useT } from '../i18n';
import { Btn, Chip, colors, formatPrice, prepKey, s } from '../ui';

export default function DishListScreen({ navigation }) {
  const { t } = useT();
  const { dishes, categories } = useStore();
  // Điều kiện lọc/sắp xếp giữ nguyên khi đi sang màn hình khác rồi quay lại (màn hình danh sách không bị hủy)
  const [search, setSearch] = useState('');
  const [catId, setCatId] = useState(null);
  const [onlyAvail, setOnlyAvail] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('none');

  const { items, rangeError } = useMemo(() => {
    const parse = (v) => (v.trim() === '' ? null : Number(v));
    const lo = parse(minPrice);
    const hi = parse(maxPrice);
    const bad = (x) => x !== null && (!isFinite(x) || x < 0);
    const rangeError = bad(lo) || bad(hi) || (lo !== null && hi !== null && lo > hi);
    let list = dishes.filter((d) => {
      if (search.trim() && !d.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      if (catId && d.categoryId !== catId) return false;
      if (onlyAvail && !d.isAvailable) return false;
      if (!rangeError) {
        if (lo !== null && d.price < lo) return false;
        if (hi !== null && d.price > hi) return false;
      }
      return true;
    });
    if (sort === 'priceAsc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'timeAsc') list = [...list].sort((a, b) => a.preparationTime - b.preparationTime);
    return { items: list, rangeError };
  }, [dishes, search, catId, onlyAvail, minPrice, maxPrice, sort]);

  const header = (
    <View style={{ padding: 12 }}>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <Btn title={`+ ${t('addDish')}`} onPress={() => navigation.navigate('DishForm')} style={{ flex: 1, marginRight: 8 }} />
        <Btn title={t('categories')} kind="ghost" onPress={() => navigation.navigate('Categories')} />
      </View>
      <TextInput style={s.input} placeholder={t('search')} value={search} onChangeText={setSearch} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        <Chip label={t('all')} active={!catId} onPress={() => setCatId(null)} />
        {categories.map((c) => (
          <Chip key={c.id} label={c.name} active={catId === c.id} onPress={() => setCatId(c.id)} />
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
        <Switch value={onlyAvail} onValueChange={setOnlyAvail} trackColor={{ true: colors.primary }} />
        <Text style={{ marginLeft: 8 }}>{t('availableOnly')}</Text>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <TextInput style={[s.input, { flex: 1, marginRight: 8 }]} placeholder={t('minPrice')} keyboardType="numeric" value={minPrice} onChangeText={setMinPrice} />
        <TextInput style={[s.input, { flex: 1 }]} placeholder={t('maxPrice')} keyboardType="numeric" value={maxPrice} onChangeText={setMaxPrice} />
      </View>
      {rangeError ? <Text style={s.err}>{t('priceRangeInvalid')}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        <Chip label={t('sortNone')} active={sort === 'none'} onPress={() => setSort('none')} />
        <Chip label={t('sortPriceAsc')} active={sort === 'priceAsc'} onPress={() => setSort('priceAsc')} />
        <Chip label={t('sortPriceDesc')} active={sort === 'priceDesc'} onPress={() => setSort('priceDesc')} />
        <Chip label={t('sortTimeAsc')} active={sort === 'timeAsc'} onPress={() => setSort('timeAsc')} />
      </ScrollView>
    </View>
  );

  const renderItem = ({ item }) => {
    const thumb = item.images.find((i) => i.isThumbnail)?.imageUrl;
    const cat = categories.find((c) => c.id === item.categoryId);
    return (
      <TouchableOpacity style={st.card} onPress={() => navigation.navigate('DishDetail', { id: item.id })}>
        {thumb ? <Image source={{ uri: thumb }} style={st.thumb} /> : <View style={[st.thumb, st.noThumb]}><Text style={{ fontSize: 24 }}>🍽</Text></View>}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={st.name}>{item.name}</Text>
          <Text style={{ color: colors.muted }}>{cat?.name ?? '-'}</Text>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>{formatPrice(item.price)}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {item.preparationTime} {t('minutes')} • {t(prepKey(item.preparationTime))} •{' '}
            <Text style={{ color: item.isAvailable ? colors.ok : colors.danger }}>{item.isAvailable ? t('available') : t('unavailable')}</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={items}
      keyExtractor={(d) => d.id}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.muted, marginTop: 20 }}>{t('noDishes')}</Text>}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 30 }}
    />
  );
}

const st = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.card, marginHorizontal: 12, marginBottom: 10, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  thumb: { width: 80, height: 80, borderRadius: 8 },
  noThumb: { backgroundColor: '#E9ECEF', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
});
