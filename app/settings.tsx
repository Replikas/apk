import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { getGatewayUrl, getGatewayToken, setGatewayUrl, setGatewayToken, testConnection } from '../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../lib/theme';

export default function Settings() {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  useEffect(() => {
    (async () => {
      const u = await getGatewayUrl();
      const t = await getGatewayToken();
      if (u) setUrl(u);
      if (t) setToken(t);
    })();
  }, []);

  const handleSave = async () => {
    if (!url.trim() || !token.trim()) {
      Alert.alert('Missing fields', 'Enter both gateway URL and auth token.');
      return;
    }
    const cleanUrl = url.trim().replace(/\/+$/, '');
    await setGatewayUrl(cleanUrl);
    await setGatewayToken(token.trim());
    Alert.alert('Saved', 'Gateway settings updated.');
  };

  const handleTest = async () => {
    await handleSave();
    setTesting(true);
    setStatus('idle');
    const result = await testConnection();
    setTesting(false);
    setStatus(result.ok ? 'ok' : 'error');
    if (!result.ok) {
      Alert.alert('Connection failed', result.error || 'Could not reach the gateway.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gateway Connection</Text>

          <Text style={styles.label}>Gateway URL</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://your-server.tail12345.ts.net"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.label}>Auth Token</Text>
          <TextInput
            style={styles.input}
            value={token}
            onChangeText={(t) => setToken(t)}
            placeholder="Gateway auth token"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.7}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, testing && styles.buttonDisabled]}
              onPress={handleTest}
              disabled={testing}
              activeOpacity={0.7}
            >
              {testing ? (
                <ActivityIndicator color={theme.colors.accent} size="small" />
              ) : (
                <Text style={styles.testButtonText}>Test Connection</Text>
              )}
            </TouchableOpacity>
          </View>

          {status === 'ok' && <Text style={styles.statusOk}>✓ Connected to Rick's gateway</Text>}
          {status === 'error' && <Text style={styles.statusError}>✗ Connection failed</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            Rick Portal v1.0.0{'\n'}
            Secure private chat with Rick via OpenClaw gateway.{'\n'}
            Connection secured by Tailscale (WireGuard).
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.headerBg,
  },
  backButton: {
    width: 80,
  },
  backText: {
    color: theme.colors.accent,
    fontSize: theme.font.md,
    paddingHorizontal: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.font.lg,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  content: {
    padding: theme.spacing.xxl,
    gap: theme.spacing.xxl,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.font.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: theme.font.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    fontSize: theme.font.md,
    color: theme.colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.colors.text,
    fontSize: theme.font.md,
    fontWeight: '600',
  },
  testButton: {
    flex: 1,
    backgroundColor: theme.colors.accentBg,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: theme.colors.accent,
    fontSize: theme.font.md,
    fontWeight: '600',
  },
  statusOk: {
    color: theme.colors.accent,
    fontSize: theme.font.sm,
    marginTop: theme.spacing.sm,
  },
  statusError: {
    color: theme.colors.danger,
    fontSize: theme.font.sm,
    marginTop: theme.spacing.sm,
  },
  aboutText: {
    color: theme.colors.textSecondary,
    fontSize: theme.font.sm,
    lineHeight: 22,
  },
});
