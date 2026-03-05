import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { isConfigured } from '../lib/api';
import { theme } from '../lib/theme';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    isConfigured().then((ok) => {
      setConfigured(ok);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bg }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (!configured) {
    return <Redirect href="/setup" />;
  }

  return <Redirect href="/chat" />;
}
