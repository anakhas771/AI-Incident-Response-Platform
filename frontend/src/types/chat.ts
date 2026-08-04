export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  is_pinned?: boolean;
  is_archived?: boolean;
  token_count?: number;
  organization?: string;
  user?: string;
}

export interface ChatCitation {
  document_id: string;
  document_title: string;
  page: number;
  chunk_index: number;
  similarity: number;
  snippet: string;
}

export type Citation = ChatCitation;

export interface ChatConfidence {
  score: number; // e.g. 0 to 100 or 0.0 to 1.0
  level?: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  reasons?: string[];
}

export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  provider?: string;
  model?: string;
  latency_ms?: number;
}

export interface ChatMessage {
  id: string;
  session_id?: string;
  role: MessageRole;
  content: string;
  tokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  citations?: ChatCitation[];
  confidence?: ChatConfidence;
  suggested_questions?: string[];
  usage?: ChatUsage;
  created_at: string;
  isStreaming?: boolean;
  error?: string;
  isOptimistic?: boolean;
}

export type SSEEventType =
  | 'start'
  | 'heartbeat'
  | 'token'
  | 'citation'
  | 'confidence'
  | 'suggested_questions'
  | 'usage'
  | 'done'
  | 'error';

export interface StreamEventPayload {
  event_id?: number;
  event_type: SSEEventType;
  payload?: unknown;
}

export interface StreamCallbacks {
  onStart?: (data: { session_id: string; status: string }) => void;
  onToken?: (token: string) => void;
  onCitation?: (citations: ChatCitation[]) => void;
  onConfidence?: (confidence: ChatConfidence) => void;
  onSuggestedQuestions?: (questions: string[]) => void;
  onUsage?: (usage: ChatUsage) => void;
  onDone?: (data: { session_id: string; status: string }) => void;
  onError?: (error: { error: string; code?: string }) => void;
}
