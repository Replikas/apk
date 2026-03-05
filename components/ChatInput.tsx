import { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { theme } from '../lib/theme';

interface Props {
  onSend: (text: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

export function ChatInput({ onSend, onStop, disabled, isStreaming }: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleStop = () => {
    if (onStop) onStop();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message Rick..."
          placeholderTextColor={theme.colors.textMuted}
          multiline
          maxLength={10000}
          editable={!disabled}
          onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
          blurOnSubmit={false}
        />
        {isStreaming ? (
          <TouchableOpacity style={styles.stopButton} onPress={handleStop} activeOpacity={0.7}>
            <View style={styles.stopIcon} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendButton, (!text.trim() || disabled) && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || disabled}
            activeOpacity={0.7}
          >
            <ArrowUp />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function ArrowUp() {
  return (
    <View style={styles.arrowContainer}>
      <View style={styles.arrowStem} />
      <View style={styles.arrowLeft} />
      <View style={styles.arrowRight} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xxl : theme.spacing.lg,
    backgroundColor: theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.sm,
    minHeight: 48,
    maxHeight: 160,
  },
  input: {
    flex: 1,
    fontSize: theme.font.md,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
    maxHeight: 120,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
    marginBottom: 2,
  },
  sendDisabled: {
    backgroundColor: theme.colors.textMuted,
  },
  stopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
    marginBottom: 2,
  },
  stopIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  arrowContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowStem: {
    width: 2,
    height: 10,
    backgroundColor: theme.colors.bg,
    position: 'absolute',
    top: 4,
  },
  arrowLeft: {
    width: 2,
    height: 7,
    backgroundColor: theme.colors.bg,
    position: 'absolute',
    top: 2,
    left: 3,
    transform: [{ rotate: '45deg' }],
  },
  arrowRight: {
    width: 2,
    height: 7,
    backgroundColor: theme.colors.bg,
    position: 'absolute',
    top: 2,
    right: 3,
    transform: [{ rotate: '-45deg' }],
  },
});
