export interface UiMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface UiGpt {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description: string;
  category?: string | null;
  tags: string[];
  starterPrompts: string[];
  model: string;
  temperature: number;
  topP: number;
  maxOutputTokens?: number | null;
  visibility: "PUBLIC" | "PRIVATE";
}

export interface UiConversation {
  id: string;
  title: string;
  gptId: string;
  updatedAt: string;
  gpt: UiGpt;
  messages: UiMessage[];
}
