import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, IconBox, PrimaryButton, SectionTitle } from '@/components/ui';
import { colors } from '@/constants/theme';
import { parseBackup, useStore } from '@/lib/store';

export default function SettingsScreen() {
  const { exercises, workouts, plan, history, importData, resetAll } = useStore();

  const confirmReset = () => {
    Alert.alert(
      'Стереть все данные?',
      'Будут удалены упражнения, тренировки, план и история. Восстановить можно только из файла резервной копии.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Стереть',
          style: 'destructive',
          onPress: () => {
            resetAll();
            setStatus('Все данные удалены');
          },
        },
      ]
    );
  };
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const exportData = async () => {
    setBusy('export');
    setStatus(null);
    try {
      const json = JSON.stringify(
        {
          app: 'train',
          version: 1,
          exportedAt: new Date().toISOString(),
          exercises,
          workouts,
          plan,
          history,
        },
        null,
        2
      );
      const date = new Date().toISOString().slice(0, 10);
      const file = new File(Paths.cache, `train-backup-${date}.json`);
      if (file.exists) file.delete();
      file.create();
      await file.write(json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          UTI: 'public.json',
          dialogTitle: 'Сохранить резервную копию',
        });
      } else {
        setStatus(`Файл сохранён: ${file.uri}`);
      }
    } catch (e) {
      setStatus(`Не удалось сохранить: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const importFile = async () => {
    setStatus(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      setBusy('import');
      const text = await new File(result.assets[0].uri).text();
      const data = parseBackup(JSON.parse(text));

      Alert.alert(
        'Заменить все данные?',
        'Текущие упражнения, тренировки, план и история будут заменены данными из файла. Это нельзя отменить.',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Заменить',
            style: 'destructive',
            onPress: () => {
              importData(data);
              setStatus('Данные загружены');
            },
          },
        ]
      );
    } catch (e) {
      setStatus(
        e instanceof SyntaxError
          ? 'Файл повреждён: не удалось прочитать JSON'
          : e instanceof Error
            ? e.message
            : 'Не удалось загрузить файл'
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Данные' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>
          Резервная копия содержит упражнения, тренировки, план на неделю и историю. Сохраните файл
          в надёжное место, чтобы перенести данные на другое устройство или восстановить их.
        </Text>

        <SectionTitle title="Сохранить" />
        <Card>
          <IconBox name="file-upload" color={colors.accent} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.cardTitle}>Экспорт</Text>
            <Text style={styles.cardText}>Создать файл со всеми данными</Text>
          </View>
        </Card>
        <View style={{ marginTop: 12 }}>
          <PrimaryButton
            title={busy === 'export' ? 'Готовим файл…' : 'Экспортировать'}
            icon="share"
            onPress={exportData}
            style={busy ? { opacity: 0.6 } : null}
          />
        </View>

        <SectionTitle title="Восстановить" />
        <Card>
          <IconBox name="file-download" color={colors.cyan} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.cardTitle}>Импорт</Text>
            <Text style={styles.cardText}>Заменит текущие данные файлом из резервной копии</Text>
          </View>
        </Card>
        <View style={{ marginTop: 12 }}>
          <PrimaryButton
            title={busy === 'import' ? 'Читаем файл…' : 'Импортировать'}
            icon="folder-open"
            color={colors.cyan}
            onPress={importFile}
            style={busy ? { opacity: 0.6 } : null}
          />
        </View>

        <SectionTitle title="Очистка" />
        <Card>
          <IconBox name="delete-forever" color={colors.danger} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.cardTitle}>Стереть все данные</Text>
            <Text style={styles.cardText}>Удалить упражнения, тренировки, план и историю</Text>
          </View>
        </Card>
        <View style={{ marginTop: 12 }}>
          <PrimaryButton
            title="Стереть все данные"
            icon="delete-forever"
            color={colors.danger}
            onPress={confirmReset}
          />
        </View>

        {status ? <Text style={styles.status}>{status}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 4 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  cardText: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  status: { color: colors.gold, fontSize: 13, marginTop: 20, textAlign: 'center' },
});
