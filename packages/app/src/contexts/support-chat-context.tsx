import type { ChatMessage, Conversation, SenderRole } from "@mastertrack/api";
import type { JsonSerialized } from "@mastertrack/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo } from "react";
import { api, handleResponse } from "../lib/api";
import { useAuth } from "./auth-context";

type ConversationJson = JsonSerialized<Conversation>;
type ChatMessageJson = JsonSerialized<ChatMessage>;

interface SupportChatContextType {
  conversations: ConversationJson[];
  isLoading: boolean;
  getConversationMessages: (conversationId: string) => ChatMessageJson[];
  getOrCreateConversation: (
    companyId: string,
    companyName: string,
    userId: string,
    userName: string
  ) => Promise<ConversationJson>;
  sendMessage: (
    conversationId: string,
    senderId: string,
    senderName: string,
    senderRole: SenderRole,
    content: string
  ) => Promise<void>;
  markAsRead: (conversationId: string, role: SenderRole) => Promise<void>;
  closeConversation: (conversationId: string) => Promise<void>;
  reopenConversation: (conversationId: string) => Promise<void>;
  getUnreadCountForAdmin: () => number;
  getUnreadCountForClient: (conversationId: string) => number;
  getUnreadCountForCompany: (companyId: string) => number;
}

const SupportChatContext = createContext<SupportChatContextType | null>(null);

interface SupportChatProviderProps {
  children: React.ReactNode;
}

export function SupportChatProvider({ children }: SupportChatProviderProps) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Buscar todas as conversas
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: async () => {
      const response = await api.api.chat.conversations.$get();
      const result = await handleResponse<{ data: ConversationJson[] }>(response);
      return result.data;
    },
    staleTime: 0,
    refetchInterval: 10000, // Poll every 10 seconds for new conversations/updates
    enabled: isAuthenticated, // Only fetch when user is authenticated
  });

  // Mutation para criar/buscar conversa
  const createConversationMutation = useMutation({
    mutationFn: async ({
      companyId,
      companyName,
      userId,
      userName,
    }: {
      companyId: string;
      companyName: string;
      userId: string;
      userName: string;
    }) => {
      const response = await api.api.chat.conversations.$post({
        json: { companyId, companyName, userId, userName },
      });
      const result = await handleResponse<{ data: ConversationJson }>(response);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });

  // Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      conversationId,
      senderId,
      senderName,
      senderRole,
      content,
    }: {
      conversationId: string;
      senderId: string;
      senderName: string;
      senderRole: SenderRole;
      content: string;
    }) => {
      const response = await api.api.chat.conversations[":id"].messages.$post({
        param: { id: conversationId },
        json: { senderId, senderName, senderRole, content },
      });
      return handleResponse<{ data: ChatMessageJson }>(response);
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["chat-messages", variables.conversationId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<ChatMessageJson[]>([
        "chat-messages",
        variables.conversationId,
      ]);

      // Optimistically add the new message
      const optimisticMessage: ChatMessageJson = {
        id: `temp-${Date.now()}`,
        conversationId: variables.conversationId,
        senderId: variables.senderId,
        senderName: variables.senderName,
        senderRole: variables.senderRole,
        content: variables.content,
        read: false,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatMessageJson[]>(
        ["chat-messages", variables.conversationId],
        (old) => [...(old ?? []), optimisticMessage]
      );

      return { previousMessages };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["chat-messages", variables.conversationId],
          context.previousMessages
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ["chat-messages", variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });

  // Mutation para marcar como lido
  const markAsReadMutation = useMutation({
    mutationFn: async ({ conversationId, role }: { conversationId: string; role: SenderRole }) => {
      const response = await api.api.chat.conversations[":id"].read.$put({
        param: { id: conversationId },
        json: { role },
      });
      return handleResponse<{ success: boolean }>(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      conversationId,
      status,
    }: {
      conversationId: string;
      status: "open" | "closed";
    }) => {
      const response = await api.api.chat.conversations[":id"].status.$put({
        param: { id: conversationId },
        json: { status },
      });
      return handleResponse<{ data: ConversationJson }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });

  // Função legada para compatibilidade - retorna mensagens de cache
  const getConversationMessages = useCallback(
    (conversationId: string): ChatMessageJson[] => {
      const cached = queryClient.getQueryData<ChatMessageJson[]>(["chat-messages", conversationId]);
      return cached ?? [];
    },
    [queryClient]
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: mutateAsync is stable
  const getOrCreateConversation = useCallback(
    async (
      companyId: string,
      companyName: string,
      userId: string,
      userName: string
    ): Promise<ConversationJson> => {
      return createConversationMutation.mutateAsync({
        companyId,
        companyName,
        userId,
        userName,
      });
    },
    []
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: mutateAsync is stable
  const sendMessage = useCallback(
    async (
      conversationId: string,
      senderId: string,
      senderName: string,
      senderRole: SenderRole,
      content: string
    ): Promise<void> => {
      await sendMessageMutation.mutateAsync({
        conversationId,
        senderId,
        senderName,
        senderRole,
        content,
      });
    },
    []
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: mutateAsync is stable
  const markAsRead = useCallback(
    async (conversationId: string, role: SenderRole): Promise<void> => {
      await markAsReadMutation.mutateAsync({ conversationId, role });
    },
    []
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: mutateAsync is stable
  const closeConversation = useCallback(async (conversationId: string): Promise<void> => {
    await updateStatusMutation.mutateAsync({ conversationId, status: "closed" });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mutateAsync is stable
  const reopenConversation = useCallback(async (conversationId: string): Promise<void> => {
    await updateStatusMutation.mutateAsync({ conversationId, status: "open" });
  }, []);

  const getUnreadCountForAdmin = useCallback(() => {
    return conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  }, [conversations]);

  const getUnreadCountForClient = useCallback(
    (conversationId: string) => {
      // Usar clientUnreadCount do banco de dados
      const conversation = conversations.find((c) => c.id === conversationId);
      return conversation?.clientUnreadCount ?? 0;
    },
    [conversations]
  );

  const getUnreadCountForCompany = useCallback(
    (companyId: string) => {
      // Soma de todas as mensagens nao lidas pelo cliente da empresa
      return conversations
        .filter((c) => c.companyId === companyId)
        .reduce((acc, c) => acc + c.clientUnreadCount, 0);
    },
    [conversations]
  );

  const value = useMemo(
    () => ({
      conversations,
      isLoading,
      getConversationMessages,
      getOrCreateConversation,
      sendMessage,
      markAsRead,
      closeConversation,
      reopenConversation,
      getUnreadCountForAdmin,
      getUnreadCountForClient,
      getUnreadCountForCompany,
    }),
    [
      conversations,
      isLoading,
      getConversationMessages,
      getOrCreateConversation,
      sendMessage,
      markAsRead,
      closeConversation,
      reopenConversation,
      getUnreadCountForAdmin,
      getUnreadCountForClient,
      getUnreadCountForCompany,
    ]
  );

  return <SupportChatContext.Provider value={value}>{children}</SupportChatContext.Provider>;
}

export function useSupportChat() {
  const context = useContext(SupportChatContext);
  if (!context) {
    throw new Error("useSupportChat must be used within a SupportChatProvider");
  }
  return context;
}

/**
 * Hook para buscar mensagens de uma conversa específica
 * Exportado separadamente porque hooks não podem ser passados via context
 */
export function useConversationMessages(conversationId: string | null) {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const response = await api.api.chat.conversations[":id"].messages.$get({
        param: { id: conversationId },
      });
      const result = await handleResponse<{ data: ChatMessageJson[] }>(response);
      return result.data;
    },
    enabled: !!conversationId,
    staleTime: 0, // Always consider data stale to ensure refetch on invalidation
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  return { messages, isLoading };
}

// Re-export types for convenience
export type { ConversationJson as Conversation, ChatMessageJson as ChatMessage };
