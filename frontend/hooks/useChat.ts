"use client";

import { useState, useCallback } from "react";
import { chatApi, type ChatMessage } from "@/lib/api";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UseChatOptions {
  token: string;
  conversationId?: string;
}

export function useChat({ token, conversationId: initialConvId }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConvId
  );
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<{
    used: number;
    limit: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // Build history for API (last 10 turns to save tokens)
      const historyForApi: ChatMessage[] = messages
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const response = await chatApi.send(
          {
            message: content.trim(),
            conversation_id: conversationId,
            history: historyForApi,
          },
          token
        );

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setConversationId(response.conversation_id);
        setUsage({ used: response.messages_used, limit: response.messages_limit });
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errMsg);
        // Remove the optimistic user message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setIsLoading(false);
      }
    },
    [messages, conversationId, isLoading, token]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
    usage,
    error,
    conversationId,
  };
}
