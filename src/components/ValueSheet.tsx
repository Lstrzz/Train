import { useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

import { PrimaryButton, RoundButton } from './ui';

const TICK = 12;
const SCREEN_WIDTH = Dimensions.get('window').width;

type Props = {
  title: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  presets?: number[];
  format?: (v: number) => string;
  onConfirm: (v: number) => void;
  onClose: () => void;
};

export function ValueSheet({
  title,
  value,
  min,
  max,
  step,
  unit,
  presets,
  format = (v) => String(v),
  onConfirm,
  onClose,
}: Props) {
  const [local, setLocal] = useState(value);

  const stepTo = (v: number) =>
    setLocal(Math.min(max, Math.max(min, v)));

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          <View style={styles.valueRow}>
            <RoundButton
              icon="remove"
              color={colors.surface2}
              iconColor={colors.text}
              onPress={() => stepTo(local - step)}
            />
            <View style={styles.valueBox}>
              <Text style={styles.value}>{format(local)}</Text>
              <Text style={styles.unit}>{unit}</Text>
            </View>
            <RoundButton
              icon="add"
              color={colors.surface2}
              iconColor={colors.text}
              onPress={() => stepTo(local + step)}
            />
          </View>

          <Ruler min={min} max={max} step={step} value={local} onChange={setLocal} />

          {presets && presets.length > 0 ? (
            <View style={styles.presets}>
              {presets.map((p) => {
                const active = p === local;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setLocal(p)}
                    style={[styles.preset, active ? styles.presetActive : null]}>
                    <Text style={[styles.presetText, active ? styles.presetTextActive : null]}>
                      {format(p)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancel}>
              <Text style={styles.cancelText}>Отмена</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Готово"
                icon="check"
                onPress={() => onConfirm(local)}
                style={{ alignSelf: 'stretch' }}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Ruler({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const count = Math.floor((max - min) / step) + 1;
  const half = SCREEN_WIDTH / 2 - TICK / 2;
  const startIndex = Math.round((value - min) / step);

  return (
    <View style={styles.ruler}>
      <View pointerEvents="none" style={styles.indicator} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={TICK}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentOffset={{ x: startIndex * TICK, y: 0 }}
        contentContainerStyle={{ paddingHorizontal: half }}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / TICK);
          const v = min + Math.min(count - 1, Math.max(0, i)) * step;
          if (v !== value) onChange(v);
        }}>
        {Array.from({ length: count }, (_, i) => {
          const v = min + i * step;
          const major = v % (step * 5) === 0;
          return (
            <View key={v} style={{ width: TICK, alignItems: 'center' }}>
              <View
                style={{
                  width: major ? 2 : 1,
                  height: major ? 34 : 18,
                  borderRadius: 1,
                  backgroundColor: major ? colors.text : colors.dim,
                }}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  title: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  valueBox: { alignItems: 'center' },
  value: {
    color: colors.text,
    fontSize: 56,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  unit: { color: colors.muted, fontSize: 14, marginTop: -4 },
  ruler: { height: 72, justifyContent: 'center' },
  indicator: {
    position: 'absolute',
    alignSelf: 'center',
    top: 4,
    bottom: 4,
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    zIndex: 2,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  presetActive: { borderColor: colors.accent, backgroundColor: colors.accent + '22' },
  presetText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  presetTextActive: { color: colors.accent },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  cancel: { paddingHorizontal: 16, paddingVertical: 14 },
  cancelText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
});
