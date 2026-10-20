import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useStore } from './store';
import { useT } from './i18n';
import { QUICK_MAX_MINUTES } from './config';

export const colors = {
  primary: '#E8590C', bg: '#F8F9FA', card: '#FFFFFF', text: '#212529',
  muted: '#868E96', border: '#DEE2E6', danger: '#E03131', ok: '#2F9E44',
};

export const formatPrice = (n) => {
  const [i, f] = String(n).split('.');
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${f ? '.' + f : ''} ₫`;
};

// Quick nếu PreparationTime <= 15 phút (không lưu thêm thuộc tính)
export const prepKey = (minutes) => (minutes <= QUICK_MAX_MINUTES ? 'quick' : 'regular');

export function Btn({ title, onPress, kind = 'primary', style }) {
  const bg = kind === 'danger' ? colors.danger : kind === 'ghost' ? '#E9ECEF' : colors.primary;
  const fg = kind === 'ghost' ? colors.text : '#fff';
  return (
    <TouchableOpacity onPress={onPress} style={[s.btn, { backgroundColor: bg }, style]}>
      <Text style={{ color: fg, fontWeight: '600' }}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active && s.chipOn]}>
      <Text style={{ color: active ? '#fff' : colors.text }}>{label}</Text>
    </TouchableOpacity>
  );
}

// Thanh trạng thái: online/offline, đang đồng bộ, lỗi MockAPI, số thay đổi chờ
export function Banner() {
  const { t } = useT();
  const { online, syncing, error, queue } = useStore();
  let msg = t('online');
  let bg = colors.ok;
  if (!online) { msg = `${t('offline')}${queue.length ? ' • ' + t('pending', { n: queue.length }) : ''}`; bg = colors.muted; }
  else if (syncing) { msg = t('syncing'); bg = '#1971C2'; }
  else if (error) { msg = t('syncError'); bg = colors.danger; }
  else if (queue.length) { msg = t('pending', { n: queue.length }); bg = '#F08C00'; }
  return (
    <View style={{ backgroundColor: bg, paddingVertical: 4, paddingHorizontal: 10 }}>
      <Text style={{ color: '#fff', fontSize: 12 }}>{msg}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center' },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginRight: 8 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, backgroundColor: colors.card, color: colors.text },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 4, color: colors.text },
  err: { color: colors.danger, marginTop: 4, fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
});
