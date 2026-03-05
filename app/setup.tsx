import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { setGatewayUrl, setGatewayToken, testConnection } from '../lib/api';
import { theme } from '../lib/theme';

export default function Setup() {
  const [url, setUrl] = useState('https://rickords.duckdns.org/gateway');
  const [token, setToken] = useState('');
  const [testing, setTesting] = useState(false);

  const handleConnect = async () => {
    if (!url.trim() || !token.trim()) {
      Alert.alert('Missing fields', 'Enter both gateway URL and auth token.');
      return;
    }

    const cleanUrl = url.trim().replace(/\/+$/, '');
    await setGatewayUrl(cleanUrl);
    await setGatewayToken(token.trim());

    setTesting(true);
    const result = await testConnection();
    setTesting(false);

    if (result.ok) {
      router.replace('/chat');
    } else {
      Alert.alert('Connection failed', result.error || 'Could not reach Rick\'s gateway.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>⚡</Text>
          <Text style={styles.title}>Rick Portal</Text>
          <Text style={styles.subtitle}>Connect to Rick's gateway</Text>
        </View>

        <View style={styles.form}>
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
            onChangeText={setToken}
            placeholder="Gateway auth token"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, testing && styles.buttonDisabled]}
            onPress={handleConnect}
            disabled={testing}
            activeOpacity={0.7}
          >
            {testing ? (
              <ActivityIndicator color={theme.colors.bg} size="small" />
            ) : (
              <Text style={styles.buttonText}>Connect</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            Make sure Tailscale is active on this device.{'\n'}
            The token is in your openclaw.json → gateway.auth.token
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.font.xxl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.font.md,
    color: theme.colors.textSecondary,
  },
  form: {
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: theme.font.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    marginBottom: 2,
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
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: theme.font.lg,
    fontWeight: '700',
    color: theme.colors.bg,
  },
  hint: {
    fontSize: theme.font.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    lineHeight: 18,
  },
});
