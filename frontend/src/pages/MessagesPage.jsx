import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Ban,
  Check,
  CheckCheck,
  ChevronLeft,
  Flag,
  Info,
  MapPin,
  MessageSquare,
  Send,
  ShieldCheck,
  Smile,
  UserX,
  WifiOff,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { api, apiErrorMessage, resolvePhotoUrl } from "../services/api";
import { AppShell } from "../components/Layout";
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  ErrorNotice,
  IconButton,
  PageSpinner,
  SearchBar,
} from "../components/ui";
import { ReportDialog } from "./DiscoveryPages";

const QUICK_REACTIONS = ["❤️", "👍", "😂", "✨", "🔥"];

function formatMessageTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function MessagesPage() {
  const { conversationId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { socket, isConnected } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [onlineMap, setOnlineMap] = useState({});
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState("");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const opener = searchParams.get("opener");
    if (opener) {
      setDraft(opener);
    }
  }, [searchParams]);
  const [sending, setSending] = useState(false);
  const [typingUserId, setTypingUserId] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [unmatchOpen, setUnmatchOpen] = useState(false);
  const [unmatchBusy, setUnmatchBusy] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [fullProfile, setFullProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  const myId = String(user?.id || user?._id || "");

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    setListError("");
    try {
      const [convRes, matchesRes] = await Promise.all([
        api.get("/conversations"),
        api.get("/matches"),
      ]);
      const rawConvs = convRes.data?.conversations || [];
      const matchPresence = {};
      (matchesRes.data?.matches || []).forEach((m) => {
        if (m.matchedUser?.id) {
          matchPresence[String(m.matchedUser.id)] = Boolean(m.matchedUser.online);
        }
      });
      setOnlineMap((prev) => ({ ...prev, ...matchPresence }));
      setConversations(rawConvs);
    } catch (err) {
      setListError(apiErrorMessage(err, "Unable to load your conversations."));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const sync = () => loadConversations();
    window.addEventListener("heartlink:matches_changed", sync);
    return () => window.removeEventListener("heartlink:matches_changed", sync);
  }, [loadConversations]);

  const activeConversation = useMemo(
    () => conversations.find((c) => String(c.id) === String(conversationId)) || null,
    [conversations, conversationId],
  );

  // Load thread messages and mark read
  const loadThread = useCallback(async (id) => {
    if (!id) {
      setMessages([]);
      return;
    }
    setLoadingThread(true);
    setThreadError("");
    try {
      const { data } = await api.get(`/conversations/${id}/messages`);
      setMessages(data.messages || []);
      await api.patch(`/conversations/${id}/read`).catch(() => {});
      setConversations((prev) =>
        prev.map((c) => (String(c.id) === String(id) ? { ...c, unreadCount: 0 } : c)),
      );
      refreshProfile?.();
    } catch (err) {
      setThreadError(apiErrorMessage(err, "Unable to load messages."));
    } finally {
      setLoadingThread(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    setTypingUserId("");
    loadThread(conversationId);
  }, [conversationId, loadThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingUserId]);

  // Socket.IO real-time room & events
  useEffect(() => {
    if (!socket) return undefined;

    const joinRoom = () => {
      if (conversationId) {
        socket.emit("join_chat", { matchId: conversationId });
        socket.emit("mark_read", { matchId: conversationId });
      }
    };

    joinRoom();
    socket.on("connect", joinRoom);

    const onNewMessage = (payload) => {
      const incomingMatchId = String(payload.matchId || "");
      const incomingSender = String(payload.sender || "");

      setConversations((prev) =>
        prev.map((c) => {
          if (String(c.id) !== incomingMatchId) return c;
          const isCurrent = String(conversationId) === incomingMatchId;
          return {
            ...c,
            unreadCount: isCurrent || incomingSender === myId ? 0 : (c.unreadCount || 0) + 1,
            lastMessage: {
              id: payload.id || payload._id,
              sender: payload.sender,
              text: payload.text,
              read: Boolean(payload.read),
              createdAt: payload.createdAt,
            },
          };
        }),
      );

      if (incomingMatchId === String(conversationId)) {
        setMessages((prev) => {
          const msgId = String(payload.id || payload._id);
          if (prev.some((m) => String(m.id || m._id) === msgId)) return prev;
          return [...prev, payload];
        });
        if (incomingSender !== myId) {
          socket.emit("mark_read", { matchId: conversationId });
          api.patch(`/conversations/${conversationId}/read`).catch(() => {});
        }
      }
    };

    const onMessagesRead = ({ matchId, readBy }) => {
      if (String(matchId) === String(conversationId) && String(readBy) !== myId) {
        setMessages((prev) =>
          prev.map((m) => (String(m.sender) === myId ? { ...m, read: true } : m)),
        );
      }
    };

    const onUserTyping = ({ matchId, userId }) => {
      if (String(matchId) === String(conversationId) && String(userId) !== myId) {
        setTypingUserId(String(userId));
      }
    };

    const onUserStopTyping = ({ matchId, userId }) => {
      if (String(matchId) === String(conversationId) && String(userId) !== myId) {
        setTypingUserId("");
      }
    };

    const onReactionUpdated = ({ matchId, messageId, reactions }) => {
      if (String(matchId) === String(conversationId)) {
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id || m._id) === String(messageId) ? { ...m, reactions: reactions || [] } : m,
          ),
        );
      }
    };

    const onPresenceUpdate = ({ userId, online }) => {
      if (userId) {
        setOnlineMap((prev) => ({ ...prev, [String(userId)]: Boolean(online) }));
      }
    };

    socket.on("new_message", onNewMessage);
    socket.on("messages_read", onMessagesRead);
    socket.on("user_typing", onUserTyping);
    socket.on("user_stop_typing", onUserStopTyping);
    socket.on("message_reaction_updated", onReactionUpdated);
    socket.on("presence_update", onPresenceUpdate);

    return () => {
      clearTimeout(typingTimerRef.current);
      if (conversationId) {
        if (isTypingRef.current) {
          socket.emit("stop_typing", { matchId: conversationId });
          isTypingRef.current = false;
        }
        socket.emit("leave_chat", { matchId: conversationId });
      }
      socket.off("connect", joinRoom);
      socket.off("new_message", onNewMessage);
      socket.off("messages_read", onMessagesRead);
      socket.off("user_typing", onUserTyping);
      socket.off("user_stop_typing", onUserStopTyping);
      socket.off("message_reaction_updated", onReactionUpdated);
      socket.off("presence_update", onPresenceUpdate);
    };
  }, [socket, conversationId, myId]);

  const handleTypingChange = (val) => {
    setDraft(val);
    if (!socket || !conversationId) return;

    if (val.trim()) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        socket.emit("typing", { matchId: conversationId });
      }
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          isTypingRef.current = false;
          socket.emit("stop_typing", { matchId: conversationId });
        }
      }, 1800);
    } else if (isTypingRef.current) {
      clearTimeout(typingTimerRef.current);
      isTypingRef.current = false;
      socket.emit("stop_typing", { matchId: conversationId });
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !conversationId || sending) return;
    if (text.length > 2000) {
      toast.error("Message cannot exceed 2000 characters.");
      return;
    }
    setSending(true);
    setDraft("");
    if (socket && isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("stop_typing", { matchId: conversationId });
    }

    try {
      if (socket && isConnected) {
        await new Promise((resolve, reject) => {
          socket.emit("send_message", { matchId: conversationId, text }, (ack) => {
            if (ack?.error) reject(new Error(ack.error));
            else resolve(ack);
          });
        });
      } else {
        const { data } = await api.post(`/conversations/${conversationId}/messages`, { text });
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        } else {
          await loadThread(conversationId);
        }
      }
    } catch (err) {
      toast.error(
        err?.response
          ? apiErrorMessage(err, "Message could not be delivered.")
          : err?.message || "Message could not be delivered.",
      );
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (messageId, emoji) => {
    if (!conversationId) return;
    try {
      if (socket && isConnected) {
        socket.emit("message_reaction", { matchId: conversationId, messageId, emoji }, (ack) => {
          if (ack?.success) {
            setMessages((prev) =>
              prev.map((m) =>
                String(m.id || m._id) === String(messageId)
                  ? { ...m, reactions: ack.reactions || [] }
                  : m,
              ),
            );
          }
        });
      } else {
        const { data } = await api.post(`/conversations/${conversationId}/messages/${messageId}/react`, {
          emoji,
        });
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id || m._id) === String(messageId)
              ? { ...m, reactions: data.reactions || [] }
              : m,
          ),
        );
      }
    } catch {
      toast.error("Could not update reaction.");
    }
  };

  const handleBlockParticipant = async () => {
    const pid = activeConversation?.participant?.id;
    if (!pid) return;
    try {
      await api.post(`/blocks/${pid}`);
      toast.success(`${activeConversation.participant.name} blocked.`);
      refreshProfile?.();
      navigate("/messages", { replace: true });
      loadConversations();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not block member."));
    }
  };

  const confirmUnmatch = async () => {
    if (!conversationId) return;
    setUnmatchBusy(true);
    try {
      await api.delete(`/matches/${conversationId}`);
      toast.success("Unmatched successfully.");
      setUnmatchOpen(false);
      refreshProfile?.();
      navigate("/messages", { replace: true });
      loadConversations();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not unmatch."));
    } finally {
      setUnmatchBusy(false);
    }
  };

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      `${c.participant?.name || ""} ${c.lastMessage?.text || ""}`.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const participant = activeConversation?.participant;
  const participantOnline = participant ? Boolean(onlineMap[String(participant.id)]) : false;

  useEffect(() => {
    if (showProfilePanel && participant?.id) {
      setLoadingProfile(true);
      api
        .get(`/profiles/${participant.id}`)
        .then(({ data }) => setFullProfile(data.profile || data.user || null))
        .catch(() => setFullProfile(null))
        .finally(() => setLoadingProfile(false));
    }
  }, [showProfilePanel, participant?.id]);

  return (
    <AppShell fullHeight>
      <div className="flex-1 flex gap-4 md:gap-6 min-h-0 h-[calc(100dvh-5.5rem)] overflow-hidden max-w-7xl mx-auto w-full px-2 sm:px-4 py-2">
        {/* Conversation List Pane matching 10-chat.png */}
        <aside
          aria-label="Conversations"
          className={`w-full md:w-80 lg:w-96 shrink-0 rounded-3xl border border-rose-100/70 dark:border-gray-700/80 bg-white dark:bg-gray-800 shadow-xs flex flex-col overflow-hidden ${
            conversationId ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 sm:p-5 border-b border-rose-100/60 dark:border-gray-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Messages</h1>
              <Badge tone={isConnected ? "success" : "warning"} dot>
                {isConnected ? "Live" : "Reconnecting"}
              </Badge>
            </div>
            <SearchBar
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search conversations..."
              label="Search conversations"
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-base-300/60">
            {listError ? (
              <div className="p-4">
                <ErrorNotice message={listError} onRetry={loadConversations} />
              </div>
            ) : loadingList ? (
              <PageSpinner label="Loading inbox..." />
            ) : filteredConversations.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title={conversations.length === 0 ? "No conversations yet" : "No matching chats"}
                description={
                  conversations.length === 0
                    ? "Mutual matches appear here when unlocked."
                    : "Try searching another name."
                }
                action={
                  conversations.length === 0 && (
                    <Link to="/discover">
                      <Button size="sm">Discover Matches</Button>
                    </Link>
                  )
                }
              />
            ) : (
              filteredConversations.map((conv) => {
                const other = conv.participant;
                const active = String(conv.id) === String(conversationId);
                const isOnline = Boolean(onlineMap[String(other?.id)]);
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => navigate(`/messages/${conv.id}`)}
                    className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors cursor-pointer ${
                      active ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-base-200/60"
                    }`}
                  >
                    <Avatar src={other?.profilePhoto} name={other?.name} size="md" online={isOnline} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-base-content truncate">
                          {other?.name}
                        </span>
                        <span className="text-[11px] hl-muted-text hl-tabular shrink-0">
                          {formatMessageTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs hl-muted-text truncate">
                          {conv.lastMessage?.text || "Matched — say hello"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white hl-tabular shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Thread Pane */}
        <section
          aria-label="Active conversation"
          className={`flex-1 flex flex-col min-w-0 rounded-3xl border border-rose-100/70 dark:border-gray-700/80 bg-white dark:bg-gray-800 shadow-xs overflow-hidden ${
            !conversationId ? "hidden md:flex" : "flex"
          }`}
        >
          {!conversationId ? (
            <div className="m-auto max-w-sm text-center p-6">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose a mutual match on the left to exchange real-time messages, reactions, and read receipts."
              />
            </div>
          ) : (
            <>
              {/* Thread Header matching 10-chat.png */}
              <div className="h-16 border-b border-rose-100/60 dark:border-gray-700/60 bg-white dark:bg-gray-800 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <IconButton
                    label="Back to conversations"
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => navigate("/messages")}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </IconButton>
                  {participant ? (
                    <Link to={`/profile/${participant.id}`} className="flex items-center gap-3 min-w-0 no-underline">
                      <Avatar
                        src={participant.profilePhoto}
                        name={participant.name}
                        size="sm"
                        online={participantOnline}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-base-content truncate flex items-center gap-1.5">
                          {participant.name}
                          <ShieldCheck className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        </p>
                        <p className="text-[11px] hl-muted-text truncate">
                          {typingUserId
                            ? "Typing..."
                            : participantOnline
                            ? "Online now"
                            : participant.city || "Offline"}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-base-content">Conversation</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {!isConnected && (
                    <Badge tone="warning" className="hidden sm:inline-flex">
                      <WifiOff className="h-3 w-3" /> HTTP fallback
                    </Badge>
                  )}
                  <Button
                    size="xs"
                    variant={showProfilePanel ? "primary" : "ghost"}
                    onClick={() => setShowProfilePanel((prev) => !prev)}
                    leftIcon={<Info className="h-3.5 w-3.5" />}
                    title="Toggle match profile"
                  >
                    <span className="hidden sm:inline">Profile</span>
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setReportOpen(true)}
                    leftIcon={<Flag className="h-3.5 w-3.5" />}
                  >
                    <span className="hidden sm:inline">Report</span>
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={handleBlockParticipant}
                    leftIcon={<Ban className="h-3.5 w-3.5" />}
                  >
                    <span className="hidden sm:inline">Block</span>
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setUnmatchOpen(true)}
                    leftIcon={<UserX className="h-3.5 w-3.5" />}
                  >
                    <span className="hidden sm:inline">Unmatch</span>
                  </Button>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
                {threadError ? (
                  <ErrorNotice message={threadError} onRetry={() => loadThread(conversationId)} />
                ) : loadingThread ? (
                  <PageSpinner label="Loading messages..." />
                ) : messages.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title={`Start talking with ${participant?.name || "your match"}`}
                    description="Messages here are shared privately between you and your match."
                  />
                ) : (
                  messages.map((msg) => {
                    const msgId = msg.id || msg._id;
                    const mine = String(msg.sender) === myId;
                    const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];

                    return (
                      <div key={msgId} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                        <div className={`group flex items-end gap-1.5 max-w-[82%] sm:max-w-[68%] ${mine ? "flex-row-reverse" : "flex-row"}`}>
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
                              mine
                                ? "bg-[#E61E50] text-white rounded-tr-none shadow-sm"
                                : "bg-gray-100 dark:bg-gray-700/80 text-gray-900 dark:text-white rounded-tl-none shadow-xs"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <div
                              className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                                mine ? "text-rose-100" : "text-gray-400"
                              }`}
                            >
                              <span>{formatMessageTime(msg.createdAt)}</span>
                              {mine &&
                                (msg.read ? (
                                  <CheckCheck className="h-3 w-3 text-white" aria-label="Read" />
                                ) : (
                                  <Check className="h-3 w-3 text-rose-200" aria-label="Sent" />
                                ))}
                            </div>
                          </div>

                          <Dropdown
                            align={mine ? "right" : "left"}
                            widthClass="w-auto"
                            trigger={({ toggle }) => (
                              <button
                                type="button"
                                onClick={toggle}
                                aria-label="Add reaction"
                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-full p-1 text-base-content/50 hover:text-base-content hover:bg-base-300/60 cursor-pointer"
                              >
                                <Smile className="h-3.5 w-3.5" />
                              </button>
                            )}
                          >
                            {({ close }) => (
                              <div className="flex items-center gap-1 px-1">
                                {QUICK_REACTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                      close();
                                      handleReact(msgId, emoji);
                                    }}
                                    className="rounded-lg p-1.5 text-base hover:bg-base-200 transition-transform hover:scale-110 cursor-pointer"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </Dropdown>
                        </div>

                        {reactions.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1 px-1">
                            {reactions.map((r, rIdx) => (
                              <button
                                key={`${r.user}-${rIdx}`}
                                type="button"
                                onClick={() => handleReact(msgId, r.emoji)}
                                className="rounded-full border border-base-300 bg-base-100 px-2 py-0.5 text-xs shadow-xs cursor-pointer"
                              >
                                {r.emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {typingUserId && (
                  <div className="flex items-center gap-2 text-xs hl-muted-text px-2">
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:240ms]" />
                    </span>
                    <span>{participant?.name || "Your match"} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Composer matching 10-chat.png */}
              <div className="border-t border-rose-100/60 dark:border-gray-700/60 bg-white dark:bg-gray-800 p-3 sm:p-4 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex items-center gap-2 max-w-4xl mx-auto"
                >
                  {/* Emoji Button */}
                  <Dropdown
                    align="left"
                    widthClass="w-auto"
                    trigger={({ toggle }) => (
                      <button
                        type="button"
                        onClick={toggle}
                        aria-label="Add emoji"
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      >
                        <Smile className="h-5 w-5" />
                      </button>
                    )}
                  >
                    {({ close }) => (
                      <div className="flex flex-wrap gap-2 p-2 max-w-xs">
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setDraft((prev) => prev + emoji);
                              close();
                            }}
                            className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </Dropdown>

                  <input
                    id="message-composer"
                    type="text"
                    maxLength={2000}
                    value={draft}
                    onChange={(e) => handleTypingChange(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E61E50]"
                  />

                  {/* Send Button matching 10-chat.png */}
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    aria-label="Send message"
                    className="h-10 w-10 rounded-full bg-[#E61E50] hover:bg-[#D01845] active:bg-[#B9143C] text-white flex items-center justify-center shadow-md shadow-rose-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </section>

        {/* Match Profile Information Pane (Desktop Column 3) */}
        {conversationId && showProfilePanel && participant && (
          <aside
            aria-label="Match Profile Overview"
            className="hidden xl:flex flex-col w-80 lg:w-88 shrink-0 border-l hl-subtle-divider bg-base-100 overflow-y-auto"
          >
            <div className="p-4 border-b hl-subtle-divider flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content flex items-center gap-2">
                Match Details
                {loadingProfile && <span className="loading loading-spinner loading-xs text-rose-500" />}
              </span>
              <IconButton
                label="Close profile panel"
                variant="ghost"
                size="xs"
                onClick={() => setShowProfilePanel(false)}
              >
                <X className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="p-5 space-y-5">
              {/* Profile Photo */}
              <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-base-300 shadow-md bg-base-200">
                <img
                  src={resolvePhotoUrl(fullProfile?.profilePhoto || participant.profilePhoto)}
                  alt={participant.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 text-white">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold">
                      {participant.name}
                      {participant.age ? `, ${participant.age}` : ""}
                    </p>
                    <ShieldCheck className="h-4 w-4 text-rose-400 shrink-0" />
                  </div>
                  <p className="text-xs text-rose-200/90 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {participant.city || fullProfile?.city || "Nearby"}
                  </p>
                </div>
              </div>

              {/* Status & Match Pill */}
              <div className="flex items-center justify-between gap-2">
                <Badge tone={participantOnline ? "success" : "neutral"} dot>
                  {participantOnline ? "Active Now" : "Recently Active"}
                </Badge>
                {fullProfile?.lookingFor && (
                  <Badge tone="primary">{fullProfile.lookingFor}</Badge>
                )}
              </div>

              {/* Bio */}
              {(fullProfile?.bio || participant.bio) && (
                <div className="space-y-1 rounded-xl border hl-subtle-divider bg-base-200/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider hl-muted-text">About</p>
                  <p className="text-xs text-base-content leading-relaxed">
                    {fullProfile?.bio || participant.bio}
                  </p>
                </div>
              )}

              {/* Interests */}
              {Array.isArray(fullProfile?.interests) && fullProfile.interests.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider hl-muted-text">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {fullProfile.interests.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg border hl-subtle-divider bg-base-200/60 px-2 py-1 text-[11px] font-medium text-base-content"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 border-t hl-subtle-divider space-y-2">
                <Link to={`/profile/${participant.id}`} className="block">
                  <Button size="sm" variant="outline" fullWidth>
                    View Full Profile
                  </Button>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setReportOpen(true)}
                    leftIcon={<Flag className="h-3.5 w-3.5" />}
                  >
                    Report
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setUnmatchOpen(true)}
                    leftIcon={<UserX className="h-3.5 w-3.5" />}
                  >
                    Unmatch
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      <ReportDialog open={reportOpen} user={participant} onClose={() => setReportOpen(false)} />

      <ConfirmDialog
        open={unmatchOpen}
        title={`Unmatch ${participant?.name || "member"}?`}
        message="This conversation will close immediately and the match will be removed."
        confirmLabel="Unmatch"
        loading={unmatchBusy}
        onCancel={() => setUnmatchOpen(false)}
        onConfirm={confirmUnmatch}
      />
    </AppShell>
  );
}
