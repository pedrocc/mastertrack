import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../contexts/auth-context";
import {
  useConversationMessages,
  useSupportChat,
  type Conversation,
} from "../../contexts/support-chat-context";

export const Route = createFileRoute("/admin/messages")({
  component: AdminMessagesPage,
});

function AdminMessagesPage() {
  const { user } = useAuth();
  const {
    conversations,
    isLoading: conversationsLoading,
    sendMessage,
    markAsRead,
    closeConversation,
    reopenConversation,
    getUnreadCountForAdmin,
  } = useSupportChat();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "closed">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get messages for selected conversation using the hook
  const { messages, isLoading: messagesLoading } = useConversationMessages(
    selectedConversation?.id ?? null
  );

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      searchTerm === "" ||
      conv.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || conv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Sort by updatedAt descending
  const sortedConversations = [...filteredConversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Sync selectedConversation with updated data from conversations list
  useEffect(() => {
    if (selectedConversation) {
      const updated = conversations.find((c) => c.id === selectedConversation.id);
      if (updated && updated.status !== selectedConversation.status) {
        setSelectedConversation(updated);
      }
    }
  }, [conversations, selectedConversation]);

  // Mark as read when selecting conversation
  useEffect(() => {
    if (selectedConversation) {
      markAsRead(selectedConversation.id, "admin");
    }
  }, [selectedConversation, markAsRead]);

  // Scroll to bottom when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Focus input when selecting conversation
  useEffect(() => {
    if (selectedConversation) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedConversation]);

  const handleSend = async () => {
    if (!message.trim() || !selectedConversation || !user) return;

    const content = message.trim();
    setMessage("");
    await sendMessage(selectedConversation.id, user.id, user.name || "Admin", "admin", content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    }
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadTotal = getUnreadCountForAdmin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mensagens de Suporte</h1>
          <p className="text-muted-foreground mt-1">Gerencie as conversas com os clientes</p>
        </div>
        {unreadTotal > 0 && (
          <Badge className="bg-primary text-white">
            {unreadTotal} {unreadTotal === 1 ? "mensagem nao lida" : "mensagens nao lidas"}
          </Badge>
        )}
      </div>

      {/* Conversations Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conversas</CardTitle>
          <div className="space-y-2 mt-2">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <Input
                placeholder="Buscar empresa ou usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                className="flex-1"
              >
                Todas
              </Button>
              <Button
                size="sm"
                variant={filterStatus === "open" ? "default" : "outline"}
                onClick={() => setFilterStatus("open")}
                className="flex-1"
              >
                Abertas
              </Button>
              <Button
                size="sm"
                variant={filterStatus === "closed" ? "default" : "outline"}
                onClick={() => setFilterStatus("closed")}
                className="flex-1"
              >
                Fechadas
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          {conversationsLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Carregando conversas...
            </div>
          ) : sortedConversations.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Nenhuma conversa encontrada
            </div>
          ) : (
            <div className="space-y-1">
              {sortedConversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedConversation(conv)}
                  className="w-full text-left p-3 rounded-lg transition-colors hover:bg-muted"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{conv.companyName}</p>
                        {conv.unreadCount > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.userName}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {conv.lastMessage || "Sem mensagens"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(conv.updatedAt)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          conv.status === "open"
                            ? "border-green-200 text-green-700 bg-green-50"
                            : "border-gray-200 text-gray-500"
                        }`}
                      >
                        {conv.status === "open" ? "Aberta" : "Fechada"}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Modal */}
      <Dialog
        open={!!selectedConversation}
        onOpenChange={(open) => !open && setSelectedConversation(null)}
      >
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0 [&>button]:hidden">
          {selectedConversation && (
            <>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary to-red-700 text-white rounded-t-lg">
                <div>
                  <h2 className="font-semibold text-lg">{selectedConversation.companyName}</h2>
                  <p className="text-sm text-white/80">{selectedConversation.userName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.status === "open" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        await closeConversation(selectedConversation.id);
                        setSelectedConversation(null);
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
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
                      Encerrar chamado
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => reopenConversation(selectedConversation.id)}
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M8 16H3v5" />
                      </svg>
                      Reabrir chamado
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedConversation(null)}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                    aria-label="Fechar"
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
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Carregando mensagens...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Nenhuma mensagem ainda
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          msg.senderRole === "admin"
                            ? "bg-primary text-white rounded-br-md"
                            : "bg-white border-2 border-gray-900 text-foreground rounded-bl-md shadow-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <div
                          className={`flex items-center gap-2 mt-1 ${
                            msg.senderRole === "admin" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span
                            className={`text-[10px] ${
                              msg.senderRole === "admin" ? "text-white/70" : "text-muted-foreground"
                            }`}
                          >
                            {msg.senderRole === "client" && `${msg.senderName} • `}
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {selectedConversation.status === "open" && (
                <div className="p-4 border-t shrink-0 bg-white">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Digite sua resposta..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
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
                      Enviar
                    </Button>
                  </div>
                </div>
              )}

              {selectedConversation.status === "closed" && (
                <div className="p-4 border-t bg-gray-50 text-center text-sm text-muted-foreground shrink-0">
                  Esta conversa foi encerrada. Reabra para continuar respondendo.
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
