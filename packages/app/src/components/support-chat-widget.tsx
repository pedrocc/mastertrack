import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/auth-context";
import { useConversationMessages, useSupportChat } from "../contexts/support-chat-context";
import { Button } from "./ui/button";

export function SupportChatWidget() {
  const { user, isAdmin } = useAuth();
  const {
    conversations,
    getOrCreateConversation,
    sendMessage,
    markAsRead,
    getUnreadCountForCompany,
  } = useSupportChat();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get messages for current conversation
  const { messages, isLoading: messagesLoading } = useConversationMessages(conversationId);

  // Get or create conversation when user opens chat
  useEffect(() => {
    const initConversation = async () => {
      if (isOpen && user?.companyId && !conversationId && !isCreating) {
        setIsCreating(true);
        setError(null);
        try {
          const conv = await getOrCreateConversation(
            user.companyId,
            user.companyName || "Empresa",
            user.id,
            user.name || "Usuario"
          );
          setConversationId(conv.id);
        } catch (err) {
          console.error("Erro ao criar conversa:", err);
          setError("Erro ao conectar com o suporte. Tente novamente.");
        } finally {
          setIsCreating(false);
        }
      }
    };
    initConversation();
  }, [isOpen, user, conversationId, isCreating, getOrCreateConversation]);

  // Mark as read when opening
  useEffect(() => {
    if (isOpen && conversationId) {
      markAsRead(conversationId, "client");
    }
  }, [isOpen, conversationId, markAsRead]);

  // Scroll to bottom when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Close chat and reset to initial state
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setConversationId(null);
    setMessage("");
    setError(null);
  }, []);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, handleClose]);

  // Não mostrar widget para admins (eles usam a página de mensagens)
  if (isAdmin) {
    return null;
  }

  // Não mostrar widget se usuário não tem empresa
  if (!user?.companyId) {
    return null;
  }

  const handleSend = async () => {
    if (!message.trim() || !user?.companyId) return;

    const content = message.trim();
    setMessage("");

    // Check if current conversation is closed
    const currentConversation = conversations.find((c) => c.id === conversationId);
    let targetConversationId = conversationId;

    if (!conversationId || currentConversation?.status === "closed") {
      // Create new conversation if none exists or current is closed
      try {
        const newConv = await getOrCreateConversation(
          user.companyId,
          user.companyName || "Empresa",
          user.id,
          user.name || "Usuario"
        );
        targetConversationId = newConv.id;
        setConversationId(newConv.id);
      } catch (err) {
        console.error("Erro ao criar nova conversa:", err);
        setError("Erro ao criar conversa. Tente novamente.");
        setMessage(content); // Restore message
        return;
      }
    }

    if (targetConversationId) {
      await sendMessage(targetConversationId, user.id, user.name || "Usuario", "client", content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const unreadCount = user?.companyId ? getUnreadCountForCompany(user.companyId) : 0;

  // Check if current conversation is closed
  const currentConversation = conversations.find((c) => c.id === conversationId);
  const isConversationClosed = currentConversation?.status === "closed";

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        type="button"
        onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-red-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 group"
        aria-label={isOpen ? "Fechar chat" : "Abrir chat de suporte"}
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary">
                  {unreadCount}
                </span>
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-red-700 px-4 py-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Suporte Mastertrack</h3>
                  <p className="text-xs text-white/80">Estamos aqui para ajudar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Fechar chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[320px] overflow-y-auto p-4 space-y-3 bg-gray-50">
            {error ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-sm text-red-600">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setError(null);
                    setConversationId(null);
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : isCreating || messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground text-sm">Carregando...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mb-3 text-primary/30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                </svg>
                <p className="text-sm font-medium">Ola! Como podemos ajudar?</p>
                <p className="text-xs mt-1">Envie sua mensagem abaixo</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderRole === "client" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.senderRole === "client"
                        ? "bg-white border-2 border-gray-900 text-foreground rounded-br-md shadow-sm"
                        : "bg-primary text-white rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        msg.senderRole === "client" ? "text-muted-foreground" : "text-white/70"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Closed conversation notice */}
          {isConversationClosed && messages.length > 0 && (
            <div className="px-4 py-4 bg-green-50 border-t border-green-200 text-center">
              <div className="flex items-center justify-center mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-green-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-green-800 mb-1">Obrigado pelo contato!</p>
              <p className="text-xs text-green-700 mb-3">
                Esta conversa foi encerrada pelo suporte.
              </p>
              <button
                type="button"
                onClick={() => setConversationId(null)}
                className="text-xs text-primary hover:underline font-medium"
              >
                Iniciar nova conversa
              </button>
            </div>
          )}

          {/* Input - only show if conversation is open or no conversation yet */}
          {!isConversationClosed && (
            <div className="p-3 bg-white border-t border-border">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  rows={1}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  className="flex-1 resize-none rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[42px] max-h-[120px]"
                  style={{ height: "42px" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "42px";
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                />
                <Button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  size="icon"
                  className="h-[42px] w-[42px] rounded-xl bg-primary hover:bg-primary/90 shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Pressione Enter para enviar
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
