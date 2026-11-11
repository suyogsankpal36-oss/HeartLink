import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { api } from "../services/api.js";
import { useRemote } from "../hooks/useRemote.js";
import { Avatar, Button, ErrorNotice, Icon, PageHeading, PageSpinner } from "../components/ui.jsx";

function shortTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function appendUnique(current, message) {
  const id = String(message.id || message._id || "");
  if (id && current.some((item) => String(item.id || item._id) === id)) return current;
  return [...current, message];
}

export function MessagesPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageError, setMessageError] = useState("");
  const endRef = useRef(null);
  const { socket } = useSocket();

  const { data: conversations, loading, error, reload } = useRemote(async () => {
    const { data } = await api.get("/conversations");
    return data.conversations || [];
  }, "conversations");

  const visibleConversations = useMemo(() => (conversations || []).filter((entry) =>
    `${entry.participant?.name || ""} ${entry.participant?.city || ""}`.toLowerCase().includes(search.trim().toLowerCase())
  ), [conversations, search]);
  const activeConversation = (conversations || []).find((entry) => String(entry.id) === String(conversationId));

  const loadMessages = useCallback(async () => {
    if (!conversationId) { setMessages([]); return; }
    setMessagesLoading(true);
    setMessageError("");
    try {
      const { data } = await api.get(`/conversations/${encodeURIComponent(conversationId)}/messages`, { params: { limit: 100 } });
      setMessages(data.messages || []);
      await api.patch(`/conversations/${encodeURIComponent(conversationId)}/read`).catch(() => {});
      await reload();
    } catch (requestError) {
      setMessageError(requestError.response?.data?.message || "We couldn’t load this conversation.");
    } finally { setMessagesLoading(false); }
  }, [conversationId, reload]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewMessage = (message) => {
      if (String(message.matchId) === String(conversationId)) {
        setMessages((current) => appendUnique(current, message));
        if (String(message.sender) !== String(user?.id || user?._id)) {
          api.patch(`/conversations/${encodeURIComponent(conversationId)}/read`).catch(() => {});
        }
      }
      reload({ silent: true });
    };

    const handleMessagesRead = ({ matchId, readBy }) => {
      if (String(matchId) === String(conversationId) && String(readBy) !== String(user?.id || user?._id)) {
        setMessages((current) => current.map((message) => String(message.sender) === String(user?.id || user?._id) ? { ...message, read: true } : message));
      }
    };

    if (conversationId) {
      socket.emit("join_chat", { matchId: conversationId });
    }

    socket.on("new_message", handleNewMessage);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      if (conversationId) {
        socket.emit("leave_chat", { matchId: conversationId });
      }
      socket.off("new_message", handleNewMessage);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [socket, conversationId, user?.id, user?._id, reload]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  async function send(event) {
    event.preventDefault();
    const content = text.trim();
    if (!content || !conversationId || sending) return;
    if (content.length > 2000) return toast.error("Messages can be up to 2,000 characters.");
    setSending(true);
    try {
      const { data } = await api.post(`/conversations/${encodeURIComponent(conversationId)}/messages`, { text: content });
      if (data.message) setMessages((current) => appendUnique(current, data.message));
      setText("");
      reload({ silent: true });
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Your message could not be sent.");
    } finally { setSending(false); }
  }

  if (loading && !conversations) return <div className="page-content"><PageSpinner label="Loading your conversations" /></div>;

  return <div className="page-content messages-page">
    <PageHeading eyebrow="A GOOD CONVERSATION STARTS HERE" title="Messages" description="Take your time, be yourself, and keep it kind." />
    {error && <ErrorNotice onRetry={reload}>{error}</ErrorNotice>}
    <section className={`messenger ${conversationId ? "has-conversation" : ""}`} aria-label="Messages">
      <aside className="conversation-panel">
        <div className="conversation-panel-head"><div><h2>Your conversations</h2><span>{conversations?.length || 0} mutual connections</span></div><span className="conversation-head-icon"><Icon name="message" /></span></div>
        <label className="conversation-search"><Icon name="search" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Find a conversation" aria-label="Find a conversation" /></label>
        {visibleConversations.length ? <div className="conversation-list">{visibleConversations.map((entry) => <Link key={entry.id} to={`/messages/${entry.id}`} className={`conversation-item ${String(entry.id) === String(conversationId) ? "active" : ""}`}><Avatar person={entry.participant} size="md" /><span className="conversation-copy"><strong>{entry.participant?.name || "HeartLink member"}</strong><small>{entry.lastMessage?.text || "You matched — say hello."}</small></span><span className="conversation-meta"><time>{shortTime(entry.lastMessage?.createdAt || entry.updatedAt)}</time>{entry.unreadCount > 0 && <b>{entry.unreadCount}</b>}</span></Link>)}</div> : <div className="conversation-empty"><Icon name="heart" /><strong>No conversations yet</strong><span>A chat opens after you both like each other.</span><Button to="/discover" variant="soft">Discover people</Button></div>}
      </aside>
      <section className="chat-panel" aria-label={activeConversation ? `Conversation with ${activeConversation.participant?.name}` : "Choose a conversation"}>
        {activeConversation ? <>
          <header className="chat-header"><Link className="chat-back" to="/messages" aria-label="Back to conversations"><Icon name="arrowLeft" /></Link><Avatar person={activeConversation.participant} size="sm" /><span><strong>{activeConversation.participant?.name || "HeartLink member"}</strong><small>{activeConversation.participant?.city || "A mutual connection"}</small></span><Link className="chat-profile-link" to={`/profile/${activeConversation.participant?.id}`} aria-label="View profile"><Icon name="user" /></Link></header>
          <div className="message-thread" role="log" aria-live="polite" aria-label="Message history">
            <div className="conversation-intro"><Avatar person={activeConversation.participant} size="lg" /><strong>You matched with {activeConversation.participant?.name?.split(" ")[0] || "someone"}.</strong><span>Say hello whenever it feels right.</span></div>
            {messagesLoading && !messages.length ? <PageSpinner label="Loading messages" /> : messageError ? <ErrorNotice onRetry={loadMessages}>{messageError}</ErrorNotice> : messages.length ? messages.map((message) => {
              const mine = String(message.sender) === String(user?.id || user?._id);
              return <article key={message.id || message._id} className={`message-bubble ${mine ? "mine" : "theirs"}`}><p>{message.text}</p><span>{shortTime(message.createdAt)}{mine && message.read && <i aria-label="Read"> · Read</i>}</span></article>;
            }) : <div className="first-message"><span><Icon name="send" /></span><strong>Start with something simple.</strong><p>Ask about a shared interest or something you noticed on their profile.</p></div>}
            <div ref={endRef} />
          </div>
          <form className="message-composer" onSubmit={send}><textarea aria-label="Write a message" placeholder={`Write ${activeConversation.participant?.name?.split(" ")[0] || "a message"} a note…`} rows={1} maxLength={2000} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><span className="composer-count">{text.length}/2000</span><button type="submit" disabled={!text.trim() || sending} aria-label="Send message"><Icon name="send" size={18} /></button></form>
          <p className="chat-safety-note"><Icon name="shield" size={13} /> Keep personal information private until you feel comfortable.</p>
        </> : <div className="chat-placeholder"><span className="placeholder-art"><span className="placeholder-orbit" /><img src="/heartlink-couple.jpg" alt="HeartLink couple illustration" /><i><Icon name="message" /></i></span><span className="eyebrow">A LITTLE SPARK, A REAL CONVERSATION</span><h2>Choose someone to say hello to.</h2><p>Your conversations live here after a mutual match. A thoughtful first message can be simple.</p></div>}
      </section>
    </section>
  </div>;
}
