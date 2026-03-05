import * as SecureStore from 'expo-secure-store';

const GATEWAY_URL_KEY = 'rick_gateway_url';
const GATEWAY_TOKEN_KEY = 'rick_gateway_token';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function getGatewayUrl(): Promise<string | null> {
  return SecureStore.getItemAsync(GATEWAY_URL_KEY);
}

export async function getGatewayToken(): Promise<string | null> {
  return SecureStore.getItemAsync(GATEWAY_TOKEN_KEY);
}

export async function setGatewayUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync(GATEWAY_URL_KEY, url);
}

export async function setGatewayToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(GATEWAY_TOKEN_KEY, token);
}

export async function isConfigured(): Promise<boolean> {
  const url = await getGatewayUrl();
  const token = await getGatewayToken();
  return !!url && !!token;
}

async function getHeaders(): Promise<Record<string, string>> {
  const token = await getGatewayToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function sendMessage(
  messages: ChatMessage[],
  model?: string,
  onChunk?: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const url = await getGatewayUrl();
  const headers = await getHeaders();

  if (!url) throw new Error('Gateway URL not configured');

  const body = JSON.stringify({
    model: model || 'google-gemini-cli/gemini-3-flash-preview',
    messages,
    stream: !!onChunk,
  });

  if (onChunk) {
    return streamMessage(url, headers, body, onChunk, signal);
  }

  const response = await fetch(`${url}/v1/chat/completions`, {
    method: 'POST',
    headers,
    body,
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const data: ChatCompletionResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function streamMessage(
  url: string,
  headers: Record<string, string>,
  body: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(`${url}/v1/chat/completions`, {
    method: 'POST',
    headers,
    body,
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onChunk(delta);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return fullText;
}

export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const url = await getGatewayUrl();
    const headers = await getHeaders();
    if (!url) return { ok: false, error: 'No gateway URL configured' };

    const response = await fetch(`${url}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'google-gemini-cli/gemini-3-flash-preview',
        messages: [{ role: 'user', content: 'ping' }],
        stream: false,
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
