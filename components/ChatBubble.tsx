import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';
import { ChatMessage } from '../lib/api';

interface Props {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function ChatBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isStreaming && styles.streaming]}>
          {message.content}
          {isStreaming && <Text style={styles.cursor}>▊</Text>}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    justifyContent: 'flex-start',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  userBubble: {
    backgroundColor: theme.colors.userBubble,
    borderBottomRightRadius: theme.spacing.xs,
  },
  assistantBubble: {
    backgroundColor: theme.colors.assistantBubble,
    borderBottomLeftRadius: theme.spacing.xs,
  },
  text: {
    fontSize: theme.font.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  streaming: {
    color: theme.colors.textSecondary,
  },
  cursor: {
    color: theme.colors.accent,
    fontSize: theme.font.md,
  },
});
