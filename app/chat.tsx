import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatMessage, sendMessage } from '../lib/api';
import {
  Conversation,
  getConversations,
  getActiveConversationId,
  setActiveConversationId,
  createConversation,
  updateConversation,
  deleteConversation,
  generateTitle,
} from '../lib/store';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import { Sidebar } from '../components/Sidebar';
import { theme } from '../lib/theme';

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const streamTextRef = useRef('');

  const loadConversations = useCallback(async () => {
    const convs = await getConversations();
    setConversations(convs);

    const activeId = await getActiveConversationId();
    if (activeId) {
      const found = convs.find((c) => c.id === activeId);
      if (found) {
        setActiveConv(found);
        setMessages(found.messages);
        return;
      }
    }

    if (convs.length > 0) {
      setActiveConv(convs[0]);
      setMessages(convs[0].messages);
      await setActiveConversationId(convs[0].id);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleNewChat = useCallback(async () => {
    const conv = await createConversation();
    setActiveConv(conv);
    setMessages([]);
    setSidebarVisible(false);
    await loadConversations();
  }, [loadConversations]);

  const handleSelectConversation = useCallback(async (id: string) => {
    const convs = await getConversations();
    const found = convs.find((c) => c.id === id);
    if (found) {
      setActiveConv(found);
      setMessages(found.messages);
      await setActiveConversationId(id);
    }
    setSidebarVisible(false);
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    await deleteConversation(id);
    const convs = await getConversations();
    setConversations(convs);
    if (activeConv?.id === id) {
      if (convs.length > 0) {
        setActiveConv(convs[0]);
        setMessages(convs[0].messages);
      } else {
        const newConv = await createConversation();
        setActiveConv(newConv);
        setMessages([]);
        await loadConversations();
      }
    }
  }, [activeConv, loadConversations]);

  const handleSend = useCallback(async (text: string) => {
    let conv = activeConv;
    if (!conv) {
      conv = await createConversation();
      setActiveConv(conv);
    }

    const userMsg: ChatMessage = { role: 'user', content: text };
    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);
    setIsStreaming(true);
    scrollToBottom();

    const controller = new AbortController();
    abortRef.current = controller;
    streamTextRef.current = '';

    try {
      const fullText = await sendMessage(
        [...messages, userMsg],
        undefined,
        (chunk) => {
          streamTextRef.current += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: streamTextRef.current,
            };
            return updated;
          });
          scrollToBottom();
        },
        controller.signal,
      );

      const finalMessages: ChatMessage[] = [
        ...messages,
        userMsg,
        { role: 'assistant', content: fullText || streamTextRef.current },
      ];
      setMessages(finalMessages);

      const title = conv.messages.length === 0 ? generateTitle(finalMessages) : conv.title;
      const updatedConv = { ...conv, messages: finalMessages, title };
      await updateConversation(updatedConv);
      setActiveConv(updatedConv);
      await loadConversations();
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        const errorMessages: ChatMessage[] = [
          ...messages,
          userMsg,
          { role: 'assistant', content: `⚠️ Error: ${e.message}` },
        ];
        setMessages(errorMessages);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [activeConv, messages, scrollToBottom, loadConversations]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const renderMessage = useCallback(({ item, index }: { item: ChatMessage; index: number }) => {
    const isLast = index === messages.length - 1;
    return (
      <ChatBubble
        message={item}
        isStreaming={isLast && isStreaming && item.role === 'assistant'}
      />
    );
  }, [messages.length, isStreaming]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)} activeOpacity={0.7} style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {activeConv?.title || 'Rick'}
        </Text>
        <TouchableOpacity onPress={handleNewChat} activeOpacity={0.7} style={styles.menuButton}>
          <Text style={styles.newIcon}>✎</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚡</Text>
            <Text style={styles.emptyTitle}>Rick Portal</Text>
            <Text style={styles.emptySubtitle}>Private & secure. Just you and Rick.</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollToBottom()}
          />
        )}

        <ChatInput
          onSend={handleSend}
          onStop={handleStop}
          disabled={isStreaming}
          isStreaming={isStreaming}
        />
      </KeyboardAvoidingView>

      <Modal
        visible={sidebarVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <Sidebar
          conversations={conversations}
          activeId={activeConv?.id || null}
          onSelect={handleSelectConversation}
          onNew={handleNewChat}
          onDelete={handleDeleteConversation}
          onSettings={() => {
            setSidebarVisible(false);
            router.push('/settings');
          }}
          onClose={() => setSidebarVisible(false)}
        />
      </Modal>
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
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 22,
    color: theme.colors.textSecondary,
  },
  newIcon: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.font.lg,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  chatArea: {
    flex: 1,
  },
  messageList: {
    paddingVertical: theme.spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.font.xxl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.font.md,
    color: theme.colors.textSecondary,
  },
});
