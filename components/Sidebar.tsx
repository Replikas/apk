import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { theme } from '../lib/theme';
import { Conversation } from '../lib/store';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSettings: () => void;
  onClose: () => void;
}

export function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, onSettings, onClose }: Props) {
  const handleLongPress = (conv: Conversation) => {
    Alert.alert('Delete chat?', `"${conv.title}"`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(conv.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.newButton} onPress={onNew} activeOpacity={0.7}>
          <Text style={styles.newButtonText}>+ New Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {conversations.map((conv) => (
          <TouchableOpacity
            key={conv.id}
            style={[styles.item, conv.id === activeId && styles.itemActive]}
            onPress={() => onSelect(conv.id)}
            onLongPress={() => handleLongPress(conv)}
            activeOpacity={0.7}
          >
            <Text style={[styles.itemTitle, conv.id === activeId && styles.itemTitleActive]} numberOfLines={1}>
              {conv.title}
            </Text>
            <Text style={styles.itemDate}>
              {new Date(conv.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
          </TouchableOpacity>
        ))}
        {conversations.length === 0 && (
          <Text style={styles.emptyText}>No conversations yet</Text>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.settingsButton} onPress={onSettings} activeOpacity={0.7}>
        <Text style={styles.settingsText}>⚙ Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.drawerBg,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  newButton: {
    backgroundColor: theme.colors.accentBg,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  newButtonText: {
    color: theme.colors.accent,
    fontSize: theme.font.sm,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: theme.colors.textSecondary,
    fontSize: theme.font.lg,
  },
  list: {
    flex: 1,
    paddingTop: theme.spacing.sm,
  },
  item: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemActive: {
    backgroundColor: theme.colors.surfaceHover,
  },
  itemTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.font.sm,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  itemTitleActive: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  itemDate: {
    color: theme.colors.textMuted,
    fontSize: theme.font.xs,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    textAlign: 'center',
    marginTop: 40,
  },
  settingsButton: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginBottom: 20,
  },
  settingsText: {
    color: theme.colors.textSecondary,
    fontSize: theme.font.md,
  },
});
