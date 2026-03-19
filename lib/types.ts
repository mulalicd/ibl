/**
 * lib/types.ts
 * Complete type definitions for IDSS IBL Lesson Planner v2.0
 * All types from CCA Instructions Section 9
 */

import { SUBJECTS } from './constants';

// ============================================================================
// UNION TYPES
// ============================================================================

export type Language = 'bosnian' | 'german' | 'english';

export type Tier = 'MICRO' | 'STANDARD' | 'EXTENDED';

export type MessageRole = 'user' | 'model';

export type ChatMode = 'onboarding' | 'generate' | 'chat';

export type DocxExportStatus = 'idle' | 'loading' | 'success' | 'error';

// ============================================================================
// PLAN AND DATABASE TYPES
// ============================================================================

/**
 * PlanRecord — Full row from Supabase plans table
 * Matches SQL schema exactly (Section 7 of CCA Instructions)
 */
export interface PlanRecord {
  id: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  language: Language;
  subject: string;
  grade: number;
  topic: string;
  duration_min: number;
  tier: Tier;
  prior_knowledge?: string | null;
  notes?: string | null;
  plan_text: string;
  inquiry_question?: string | null;
  generation_time_ms?: number | null;
  gemini_key_index?: number | null;
  is_favourite: boolean;
  is_deleted: boolean;
  docx_export_count: number;
}

/**
 * PlanCardData — Subset of PlanRecord for dashboard cards
 */
export type PlanCardData = Pick<
  PlanRecord,
  | 'id'
  | 'subject'
  | 'grade'
  | 'topic'
  | 'created_at'
  | 'duration_min'
  | 'tier'
  | 'language'
  | 'inquiry_question'
  | 'is_favourite'
>;

/**
 * GenerateParams — Parameters for plan generation (Mode B)
 */
export interface GenerateParams {
  language: Language;
  subject: string;
  grade: number;
  topic: string;
  duration_min: number;
  tier: Tier;
  prior_knowledge?: string;
  notes?: string;
  zpd_calibration?: string;
}

/**
 * PlanFormData — User-entered form data before confirmation
 */
export interface PlanFormData {
  language?: Language;
  subject?: string;
  grade?: number;
  topic?: string;
  duration_min: number;
  prior_knowledge?: string;
  notes?: string;
}

/**
 * GenerateRequest — Request body for /api/chat in generate mode
 */
export interface GenerateRequest {
  mode: 'generate';
  messages: { role: MessageRole; content: string }[];
  params: GenerateParams;
}

/**
 * OnboardingRequest — Request body for /api/chat in onboarding mode
 */
export interface OnboardingRequest {
  mode: 'onboarding';
  messages: { role: MessageRole; content: string }[];
}

/**
 * ChatRequest — Request body for /api/chat in chat mode (Mode C)
 */
export interface ChatRequest {
  mode: 'chat';
  messages: { role: MessageRole; content: string }[];
  plan_id: string;
  plan_context: string;
}

/**
 * GenerateResponse — Response from /api/chat endpoint
 */
export interface GenerateResponse {
  success: true;
  text: string;
  mode: ChatMode;
  plan_id: string | null;
  keyIndex: number;
  durationMs: number;
}

/**
 * PlansListResponse — Paginated API response for GET /api/plans
 */
export interface PlansListResponse {
  plans: PlanCardData[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * ApiError — Standard error response
 */
export interface ApiError {
  error: string;
  details?: Record<string, unknown>;
  status?: number;
}

// ============================================================================
// CHAT AND CONVERSATION TYPES
// ============================================================================

/**
 * ChatMessage — Single message in a conversation
 */
export interface ChatMessage {
  id: string; // client-side UUID
  role: MessageRole;
  content: string;
  timestamp: string;
  isPlan?: boolean; // true if content is a generated plan
  plan_id?: string; // populated after auto-save
}

/**
 * ConversationState — Full conversation state in memory
 */
export interface ConversationState {
  mode: ChatMode;
  messages: ChatMessage[];
  activePlanId: string | null;
  activePlan: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * OnboardingState — Guided input collection state (Mode A, Protocol 0)
 * Collected step by step: step 0-6
 * Step 0: Welcome
 * Step 1: Subject
 * Step 2: Grade
 * Step 3: Topic
 * Step 4: Duration
 * Step 5: Prior Knowledge
 * Step 6: Confirmation
 */
export interface OnboardingState {
  step: number; // 0-6
  language?: Language;
  subject?: string;
  grade?: number;
  topic?: string;
  duration_min?: number;
  prior_knowledge?: string;
  notes?: string;
  confirmed: boolean;
}

/**
 * DocxExportState — DOCX export progress and status
 */
export interface DocxExportState {
  status: DocxExportStatus;
  filename?: string;
  error?: string;
}

// ============================================================================
// GEMINI/AI TYPES
// ============================================================================

/**
 * GeminiChatRequest — Unified request to Gemini for all three modes
 */
export interface GeminiChatRequest {
  mode: ChatMode;
  messages: { role: MessageRole; content: string }[];
  plan_context?: string; // Mode C only
  params?: GenerateParams; // Mode B only
}

/**
 * GeminiResult — Response from geminiChat() function
 */
export interface GeminiResult {
  text: string;
  keyIndex: number;
  durationMs: number;
}

// ============================================================================
// DASHBOARD AND UI STATE TYPES
// ============================================================================

/**
 * DashboardFilters — Filter state for plan list on dashboard
 */
export interface DashboardFilters {
  subject?: string;
  grade?: number | null;
  language?: Language | null;
  tier?: Tier | null;
  isFavourite?: boolean;
  searchQuery?: string;
  sortBy?: 'created_at' | 'updated_at' | 'subject' | 'grade';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// DERIVED TYPES FROM CONSTANTS
// ============================================================================

/**
 * Subject — Derived from SUBJECTS const in lib/constants.ts
 * Includes all 23 official IDSS subjects
 */
export type Subject = typeof SUBJECTS[number];
