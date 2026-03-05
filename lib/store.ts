import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from './api';

const CONVERSATIONS_KEY = 'rick_conversations';
const ACTIVE_CONV_KEY = 'rick_active_conversation';

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function getConversations(): Promise<Conversation[]> {
  const raw = await AsyncStorage.getItem(CONVERSATIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveConversations(convs: Conversation[]): Promise<void> {
  await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
}

export async function getActiveConversationId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_CONV_KEY);
}

export async function setActiveConversationId(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_CONV_KEY, id);
}

export async function createConversation(): Promise<Conversation> {
  const conv: Conversation = {
    id: generateId(),
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const convs = await getConversations();
  convs.unshift(conv);
  await saveConversations(convs);
  await setActiveConversationId(conv.id);
  return conv;
}

export async function updateConversation(conv: Conversation): Promise<void> {
  const convs = await getConversations();
  const idx = convs.findIndex((c) => c.id === conv.id);
  if (idx >= 0) {
    convs[idx] = { ...conv, updatedAt: Date.now() };
  } else {
    convs.unshift({ ...conv, updatedAt: Date.now() });
  }
  await saveConversations(convs);
}

export async function deleteConversation(id: string): Promise<void> {
  const convs = await getConversations();
  const filtered = convs.filter((c) => c.id !== id);
  await saveConversations(filtered);
  const activeId = await getActiveConversationId();
  if (activeId === id) {
    if (filtered.length > 0) {
      await setActiveConversationId(filtered[0].id);
    } else {
      await AsyncStorage.removeItem(ACTIVE_CONV_KEY);
    }
  }
}

export function generateTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'New Chat';
  const text = firstUser.content.slice(0, 50);
  return text.length < firstUser.content.length ? text + '...' : text;
}
