import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useLocation } from "react-router-dom";

/* API imports */
import {
  getChatPartners,
  getConversation,
  sendMessage,
  editMessage,
  reactToMessage,
  pinMessage,
  deleteMessage,
  getPinnedMessages,
  markMessagesRead,
} from "../api/messageAPI";

import {
  getMyGroups,
  getGroupMessages,
  sendGroupMessage,
} from "../api/groupAPI";

import { getAllMessageableUsers } from "../api/authAPI";

import { blockUser, unblockUser, getBlockedUsers } from "../api/blockAPI";

/* Context */
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

/* Utils */
import { format, formatDistanceToNow } from "date-fns";

/* Components */
import Modal from "../components/Modal";

/* Icons */
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Search,
  Circle,
  Users,
  MoreVertical,
  Edit2,
  Trash2,
  ThumbsUp,
  Pin,
  PinOff,
  Reply,
  X,
  Check,
  CheckCheck,
  Ban,
  ShieldOff,
  ThumbsDown,
  Hash,
  Copy,
  ArrowRight,
  Clock,
  Info,
  Shield,
  Briefcase,
  UserCircle,
} from "lucide-react";
/* ═══════════════════════════════════════
   CONTEXT MENU
═══════════════════════════════════════ */
const ContextMenu = ({
  msg,
  mine,
  onEdit,
  onDelete,
  onReact,
  onPin,
  onReply,
  onCopy,
  onClose,
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items = [
    { icon: Reply, label: "Reply", fn: onReply },
    { icon: Copy, label: "Copy", fn: onCopy },
    { icon: ThumbsUp, label: "Like", fn: () => onReact("like") },
    { icon: ThumbsDown, label: "Unlike", fn: () => onReact("unlike") },
    {
      icon: msg.isPinned ? PinOff : Pin,
      label: msg.isPinned ? "Unpin" : "Pin",
      fn: onPin,
    },
    ...(mine
      ? [
          { icon: Edit2, label: "Edit", fn: onEdit },
          { icon: Trash2, label: "Delete", fn: onDelete, danger: true },
        ]
      : []),
  ];

  return (
    <div
      ref={ref}
      className="absolute z-40 bg-white rounded-xl shadow-card-lg border border-panel-200
                 py-1 min-w-[150px] animate-scale-in"
      style={{
        bottom: "calc(100% + 4px)",
        [mine ? "right" : "left"]: 0,
      }}
    >
      {items.map((a) => (
        <button
          key={a.label}
          onClick={() => {
            a.fn();
            onClose();
          }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium
                      transition-colors duration-100 hover:bg-panel-50
                      ${a.danger ? "text-red-600 hover:bg-red-50" : "text-panel-700"}`}
        >
          <a.icon size={13} /> {a.label}
        </button>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════
   DIRECT MESSAGE BUBBLE
═══════════════════════════════════════ */
const MessageBubble = ({
  msg,
  mine,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const likes = msg.reactions?.filter((r) => r.type === "like").length || 0;
  const unlikes = msg.reactions?.filter((r) => r.type === "unlike").length || 0;

  const handleCopy = () =>
    navigator.clipboard.writeText(msg.content).catch(() => {});

  if (msg.isDeleted) {
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <p
          className="text-xs text-panel-400 italic px-3 py-1.5 bg-panel-100
                      rounded-full border border-dashed border-panel-200"
        >
          Message deleted
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} group`}>
      <div className="max-w-[78%] sm:max-w-[65%]">
        {msg.replyPreview && (
          <div
            className="mb-1 px-3 py-1.5 rounded-lg border-l-2 border-brand-400
                          bg-panel-100 text-xs text-panel-500"
          >
            <p className="font-semibold text-brand-600 text-[10px]">
              {msg.replyPreview.sender}
            </p>
            <p className="truncate">{msg.replyPreview.content}</p>
          </div>
        )}

        <div className="relative">
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-sm
                          ${
                            mine
                              ? "bg-brand-600 text-white rounded-br-md"
                              : "bg-white text-panel-800 border border-panel-200 rounded-bl-md shadow-sm"
                          }`}
          >
            {msg.isPinned && (
              <p
                className={`text-[9px] flex items-center gap-0.5 mb-1
                             ${mine ? "text-brand-200" : "text-brand-500"}`}
              >
                <Pin size={8} /> Pinned
              </p>
            )}
            <p className="break-words whitespace-pre-wrap leading-relaxed">
              {msg.content}
            </p>
            <div className="flex items-center justify-between gap-3 mt-1">
              <span
                className={`text-[9px] ${mine ? "text-brand-200" : "text-panel-400"}`}
              >
                {format(new Date(msg.createdAt), "HH:mm")}
                {msg.isEdited && " · edited"}
              </span>
              {mine && (
                <span
                  className={`text-[9px] flex items-center
                                  ${mine ? "text-brand-200" : "text-panel-400"}`}
                >
                  {msg.read ? <CheckCheck size={10} /> : <Check size={10} />}
                </span>
              )}
            </div>
          </div>

          {(likes > 0 || unlikes > 0) && (
            <div className={`flex gap-1 mt-0.5 ${mine ? "justify-end" : ""}`}>
              {likes > 0 && (
                <span
                  className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white
                                 border border-panel-200 rounded-full text-[10px] shadow-sm"
                >
                  <ThumbsUp size={8} className="text-brand-500" /> {likes}
                </span>
              )}
              {unlikes > 0 && (
                <span
                  className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white
                                 border border-panel-200 rounded-full text-[10px] shadow-sm"
                >
                  <ThumbsDown size={8} className="text-red-400" /> {unlikes}
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`absolute top-1 ${mine ? "-left-7" : "-right-7"}
                        opacity-0 group-hover:opacity-100 transition-opacity
                        duration-150 btn-icon p-1`}
          >
            <MoreVertical size={12} />
          </button>

          {showMenu && (
            <ContextMenu
              msg={msg}
              mine={mine}
              onEdit={() => onEdit(msg)}
              onDelete={() => onDelete(msg._id)}
              onReact={(type) => onReact(msg._id, type)}
              onPin={() => onPin(msg._id)}
              onReply={() => onReply(msg)}
              onCopy={handleCopy}
              onClose={() => setShowMenu(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   GROUP BUBBLE
═══════════════════════════════════════ */
const GroupBubble = ({ msg, mine, onReply }) => {
  const ROLE_COLORS = {
    admin: {
      bg: "bg-brand-100",
      text: "text-brand-700",
      name: "text-brand-600",
    },
    hr: { bg: "bg-blue-100", text: "text-blue-700", name: "text-blue-600" },
    employee: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      name: "text-purple-600",
    },
  };
  const rc = ROLE_COLORS[msg.senderRole] || ROLE_COLORS.employee;

  if (msg.isDeleted) {
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <p className="text-xs text-panel-400 italic px-3 py-1.5 bg-panel-100 rounded-full">
          Message deleted
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} gap-2`}>
      {!mine && (
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center
                         text-[10px] font-bold flex-shrink-0 mt-auto ${rc.bg} ${rc.text}`}
        >
          {msg.sender[0].toUpperCase()}
        </div>
      )}
      <div className="max-w-[70%]">
        {!mine && (
          <p className={`text-[10px] font-semibold mb-0.5 ${rc.name}`}>
            {msg.sender}
            <span className="text-panel-400 font-normal ml-1">
              ({msg.senderRole})
            </span>
          </p>
        )}
        {msg.replyTo && (
          <div
            className="mb-1 px-2.5 py-1 rounded-lg border-l-2 border-brand-400
                          bg-panel-100 text-xs text-panel-500"
          >
            <p className="font-semibold text-[10px] text-brand-600">
              {msg.replyTo.sender}
            </p>
            <p className="truncate">{msg.replyTo.content}</p>
          </div>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm group relative
                        ${
                          mine
                            ? "bg-brand-600 text-white rounded-br-md"
                            : "bg-white border border-panel-200 text-panel-800 rounded-bl-md shadow-sm"
                        }`}
        >
          <p className="break-words whitespace-pre-wrap leading-relaxed">
            {msg.content}
          </p>
          <div className="flex items-center justify-between mt-0.5 gap-2">
            <span
              className={`text-[9px] ${mine ? "text-brand-200" : "text-panel-400"}`}
            >
              {format(new Date(msg.createdAt), "HH:mm")}
            </span>
            <button
              onClick={() => onReply(msg)}
              className={`opacity-0 group-hover:opacity-100 transition-opacity
                          text-[9px] flex items-center gap-0.5
                          ${
                            mine
                              ? "text-brand-200 hover:text-white"
                              : "text-panel-400 hover:text-brand-600"
                          }`}
            >
              <Reply size={9} /> reply
            </button>
          </div>
        </div>
        {msg.reactions?.length > 0 && (
          <div
            className={`flex flex-wrap gap-0.5 mt-0.5 ${mine ? "justify-end" : ""}`}
          >
            {Object.entries(
              msg.reactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {}),
            ).map(([emoji, count]) => (
              <span
                key={emoji}
                className="text-[10px] bg-white border border-panel-200
                               rounded-full px-1.5 py-0.5 shadow-sm"
              >
                {emoji} {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   CONTACT AVATAR
═══════════════════════════════════════ */
const ContactAvatar = ({ contact, isOnline, isBlocked, size = "w-9 h-9" }) => {
  const colors = {
    admin: "bg-brand-100 text-brand-700",
    hr: "bg-blue-100 text-blue-700",
    employee: "bg-purple-100 text-purple-700",
  };

  const initials =
    contact.firstName && contact.lastName
      ? `${contact.firstName[0]}${contact.lastName[0]}`
      : contact.username[0].toUpperCase();

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${size} rounded-full flex items-center justify-center
                       text-xs font-bold ${colors[contact.role] || colors.employee}`}
      >
        {initials}
      </div>
      {isOnline && (
        <Circle
          size={8}
          className="absolute -bottom-0 -right-0 text-green-500
                                    fill-green-500 stroke-white"
          strokeWidth={3}
        />
      )}
      {isBlocked && !isOnline && (
        <div
          className="absolute -bottom-0 -right-0 w-3 h-3 bg-red-500
                        rounded-full flex items-center justify-center"
        >
          <Ban size={7} className="text-white" />
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════
   ROLE BADGE
═══════════════════════════════════════ */
const RoleIcon = ({ role }) => {
  if (role === "admin") return <Shield size={10} className="text-brand-500" />;
  if (role === "hr") return <Users size={10} className="text-blue-500" />;
  return <Briefcase size={10} className="text-purple-500" />;
};

/* ═══════════════════════════════════════
   MAIN MESSAGES PAGE
═══════════════════════════════════════ */
const Messages = () => {
  const { user } = useAuth();
  const { socket, onlineUsers, typingUsers, emitTyping, emitStopTyping } =
    useSocket();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("direct");
  const [allUsers, setAllUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [blockModal, setBlockModal] = useState(null);
  const [pinnedModal, setPinnedModal] = useState(false);
  const [pinnedMsgs, setPinnedMsgs] = useState([]);

  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupReplyTo, setGroupReplyTo] = useState(null);
  const [groupTyping, setGroupTyping] = useState({});

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeout = useRef(null);

  const isOnline = (u) => onlineUsers.includes(u?.toLowerCase());
  const isBlocked = (u) => blocked.includes(u?.toLowerCase());

  const scrollBottom = useCallback(() => {
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      80,
    );
  }, []);

  /* ── Fetch all Users ── */
const fetchAll = useCallback(async () => {
  try {
    setLoading(true);

    /* Run all requests — handle each independently */
    const [msgRes, userRes, blockRes, groupRes] = await Promise.allSettled([
      getChatPartners(),
      getAllMessageableUsers(),
      getBlockedUsers(),
      getMyGroups(),
    ]);

    /* Partners */
    if (msgRes.status === "fulfilled") {
      setPartners(msgRes.value.data.data || []);
    }

    /* All users — main fix */
    if (userRes.status === "fulfilled") {
      const users = (userRes.value.data.data || []).filter(
        (u) => u.username !== user?.username
      );
      setAllUsers(users);
      console.log("[Messages] Users loaded:", users.length, users.map(u => u.username));
    } else {
      console.error("[Messages] Failed to load users:", userRes.reason?.message);
    }

    /* Blocked users */
    if (blockRes.status === "fulfilled") {
      setBlocked(blockRes.value.data.data || []);
    } else {
      console.warn("[Messages] Could not load blocked users:", blockRes.reason?.message);
      setBlocked([]);
    }

    /* Groups */
    if (groupRes.status === "fulfilled") {
      setGroups(groupRes.value.data.data || []);
    } else {
      setGroups([]);
    }

  } catch (err) {
    console.error("[Messages] fetchAll critical error:", err.message);
  } finally {
    setLoading(false);
  }
}, [user?.username]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ── Handle ?open=username from notification ── */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openUser = params.get("open");
    if (openUser && allUsers.length > 0) {
      loadConversation(openUser.toLowerCase());
      window.history.replaceState({}, "", "/messages");
    }
    // eslint-disable-next-line
  }, [location.search, allUsers.length]);

  /* ── Load direct chat ── */
  const loadConversation = useCallback(
    async (partner) => {
      setActive(partner);
      setActiveGroup(null);
      setShowSidebar(false);
      setReplyTo(null);
      setGroupReplyTo(null);
      setText("");
      try {
        const res = await getConversation(partner);
        setMessages(res.data.data || []);
        markMessagesRead(partner);
        scrollBottom();
      } catch {}
    },
    [scrollBottom],
  );

  /* ── Load group ── */
  const loadGroup = useCallback(
    async (group) => {
      setActiveGroup(group);
      setActive(null);
      setShowSidebar(false);
      setGroupReplyTo(null);
      setText("");
      try {
        const res = await getGroupMessages(group._id);
        setGroupMessages(res.data.data || []);
        scrollBottom();
        if (socket) socket.emit("join_group", group._id);
      } catch {}
    },
    [scrollBottom, socket],
  );

  /* ── Socket listeners ── */
  useEffect(() => {
    if (!socket) return;

    const handlers = {
      new_message: (msg) => {
        if (msg.sender === active || msg.receiver === active) {
          setMessages((prev) => {
            if (prev.find((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender === active) markMessagesRead(active);
          scrollBottom();
        }
        fetchAll();
      },
      message_edited: (msg) =>
        setMessages((p) => p.map((m) => (m._id === msg._id ? msg : m))),
      message_reaction: (msg) =>
        setMessages((p) => p.map((m) => (m._id === msg._id ? msg : m))),
      message_pinned: (msg) =>
        setMessages((p) => p.map((m) => (m._id === msg._id ? msg : m))),
      message_deleted: (msg) =>
        setMessages((p) => p.map((m) => (m._id === msg._id ? msg : m))),
      messages_read: () =>
        setMessages((p) => p.map((m) => ({ ...m, read: true }))),

      group_message: ({ groupId, message }) => {
        if (activeGroup?._id === groupId) {
          setGroupMessages((prev) => [...prev, message]);
          scrollBottom();
        }
      },
      group_message_reaction: ({ groupId, messageId, reactions }) => {
        if (activeGroup?._id === groupId) {
          setGroupMessages((p) =>
            p.map((m) =>
              String(m._id) === String(messageId) ? { ...m, reactions } : m,
            ),
          );
        }
      },
      group_user_typing: ({ sender, groupId }) => {
        if (activeGroup?._id === groupId)
          setGroupTyping((p) => ({ ...p, [sender]: true }));
      },
      group_user_stop_typing: ({ sender }) => {
        setGroupTyping((p) => {
          const n = { ...p };
          delete n[sender];
          return n;
        });
      },
    };

    Object.entries(handlers).forEach(([e, fn]) => socket.on(e, fn));
    return () =>
      Object.entries(handlers).forEach(([e, fn]) => socket.off(e, fn));
  }, [socket, active, activeGroup, fetchAll, scrollBottom]);

  /* ── Typing ── */
  const handleTyping = (val) => {
    setText(val);
    if (active) {
      emitTyping(active);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => emitStopTyping(active), 1500);
    } else if (activeGroup && socket) {
      socket.emit("group_typing", {
        sender: user?.username,
        groupId: activeGroup._id,
      });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit("group_stop_typing", {
          sender: user?.username,
          groupId: activeGroup._id,
        });
      }, 1500);
    }
  };

  /* ── Send ── */
  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const msgText = text.trim();
    setText("");
    setSending(true);

    try {
      if (activeGroup) {
        await sendGroupMessage(activeGroup._id, {
          content: msgText,
          replyTo: groupReplyTo
            ? { sender: groupReplyTo.sender, content: groupReplyTo.content }
            : null,
        });
        setGroupReplyTo(null);
        const res = await getGroupMessages(activeGroup._id);
        setGroupMessages(res.data.data || []);
        scrollBottom();
        socket?.emit("group_stop_typing", {
          sender: user?.username,
          groupId: activeGroup._id,
        });
      } else if (active) {
        const target = allUsers.find((u) => u.username === active);
        await sendMessage({
          receiver: active,
          content: msgText,
          receiverRole: target?.role || "employee",
          replyTo: replyTo?._id || null,
        });
        setReplyTo(null);
        emitStopTyping(active);
        const res = await getConversation(active);
        setMessages(res.data.data || []);
        fetchAll();
        scrollBottom();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to send.");
      setText(msgText);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleEdit = async () => {
    if (!editingMsg || !editText.trim()) return;
    try {
      await editMessage(editingMsg._id, editText.trim());
      setEditingMsg(null);
      setEditText("");
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteMessage(deleteModal);
      setDeleteModal(null);
    } catch {}
  };

  const handleBlock = async () => {
    if (!blockModal) return;
    try {
      isBlocked(blockModal)
        ? await unblockUser(blockModal)
        : await blockUser(blockModal);
      fetchAll();
      setBlockModal(null);
    } catch {}
  };

  const loadPinned = async () => {
    if (!active) return;
    try {
      const res = await getPinnedMessages(active);
      setPinnedMsgs(res.data.data || []);
      setPinnedModal(true);
    } catch {}
  };

  /* ── Contact list — ALL users sorted ── */
  const contactList = useMemo(() => {
    const partnerMap = {};
    partners.forEach((p) => {
      partnerMap[p._id] = p;
    });

    return allUsers
      .filter((u) => {
        const q = search.toLowerCase();
        return (
          u.username.toLowerCase().includes(q) ||
          (u.firstName && u.firstName.toLowerCase().includes(q)) ||
          (u.lastName && u.lastName.toLowerCase().includes(q)) ||
          (u.role || "").toLowerCase().includes(q)
        );
      })
      .map((u) => ({
        ...u,
        lastMessage: partnerMap[u.username]?.lastMessage || "",
        lastTime: partnerMap[u.username]?.lastTime || null,
        unread: partnerMap[u.username]?.unread || 0,
        hasConvo: !!partnerMap[u.username],
      }))
      .sort((a, b) => {
        /* 1. Active conversations first */
        if (a.hasConvo !== b.hasConvo) return b.hasConvo ? 1 : -1;
        /* 2. Most recent */
        const aTime = a.lastTime ? new Date(a.lastTime).getTime() : 0;
        const bTime = b.lastTime ? new Date(b.lastTime).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        /* 3. Online next */
        const aO = isOnline(a.username) ? 1 : 0;
        const bO = isOnline(b.username) ? 1 : 0;
        if (bO !== aO) return bO - aO;
        /* 4. Role order */
        const roleOrder = { admin: 0, hr: 1, employee: 2 };
        return (roleOrder[a.role] || 2) - (roleOrder[b.role] || 2);
      });
  }, [allUsers, partners, search, onlineUsers]);

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  const activeContact = allUsers.find((u) => u.username === active);
  const groupTypingList = Object.keys(groupTyping).filter(
    (u) => u !== user?.username,
  );
  const totalUnread = partners.reduce((s, p) => s + (p.unread || 0), 0);

  const displayName = (contact) => {
    if (!contact) return "";
    if (contact.firstName && contact.lastName)
      return `${contact.firstName} ${contact.lastName}`;
    return contact.username;
  };

  /* ════════════════════════════════════
     RENDER
  ════════════════════════════════════ */
  return (
    <div style={{ height: "calc(100vh - 8rem)" }}>
      <div className="card h-full flex overflow-hidden">
        {/* ════════════════════════════
            SIDEBAR
        ════════════════════════════ */}
        <div
          className={`${showSidebar ? "flex" : "hidden"} md:flex
                         flex-col w-full md:w-72 lg:w-80 border-r border-panel-100`}
        >
          {/* Tab Bar */}
          <div className="flex border-b border-panel-100">
            {[
              {
                key: "direct",
                label: "Messages",
                Icon: MessageCircle,
                badge: totalUnread,
              },
              { key: "groups", label: "Groups", Icon: Hash, badge: 0 },
            ].map(({ key, label, Icon, badge }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5
                                  py-2.5 text-xs font-semibold border-b-2 transition-all duration-150
                                  ${
                                    activeTab === key
                                      ? "border-brand-500 text-brand-700 bg-brand-50/30"
                                      : "border-transparent text-panel-500 hover:text-panel-700"
                                  }`}
              >
                <Icon size={13} /> {label}
                {badge > 0 && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                                   bg-brand-600 text-white"
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-2 border-b border-panel-100">
            {activeTab === "direct" && (
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="text-[10px] text-panel-500 font-medium">
                  {allUsers.length} users ·{" "}
                  {allUsers.filter((u) => isOnline(u.username)).length} online
                </span>
              </div>
            )}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-panel-400"
              />
              <input
                type="search"
                placeholder={
                  activeTab === "direct"
                    ? "Search name or role..."
                    : "Search groups..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9 py-2 text-xs"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {/* DIRECT */}
            {activeTab === "direct" &&
              (loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="skeleton w-9 h-9 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3 w-24" />
                        <div className="skeleton h-2.5 w-36" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : contactList.length === 0 ? (
                <div className="p-6 text-center text-xs text-panel-400">
                  <Users size={28} className="mx-auto mb-2 text-panel-300" />
                  <p className="font-medium">No users found</p>
                </div>
              ) : (
                <>
                  {/* Section: conversations */}
                  {contactList.some((c) => c.hasConvo) && (
                    <div className="px-3 py-1.5 bg-panel-50 border-b border-panel-100">
                      <p className="text-[10px] font-semibold text-panel-400 uppercase tracking-wide">
                        Conversations
                      </p>
                    </div>
                  )}

                  {contactList
                    .filter((c) => c.hasConvo)
                    .map((c) => (
                      <ContactItem
                        key={c.username}
                        c={c}
                        active={active}
                        loadConversation={loadConversation}
                        isOnline={isOnline}
                        isBlocked={isBlocked}
                        typingUsers={typingUsers}
                        displayName={displayName}
                      />
                    ))}

                  {/* Section: all users */}
                  <div className="px-3 py-1.5 bg-panel-50 border-b border-panel-100 border-t border-panel-100">
                    <p className="text-[10px] font-semibold text-panel-400 uppercase tracking-wide">
                      All Users
                    </p>
                  </div>

                  {contactList
                    .filter((c) => !c.hasConvo)
                    .map((c) => (
                      <ContactItem
                        key={c.username}
                        c={c}
                        active={active}
                        loadConversation={loadConversation}
                        isOnline={isOnline}
                        isBlocked={isBlocked}
                        typingUsers={typingUsers}
                        displayName={displayName}
                      />
                    ))}
                </>
              ))}

            {/* GROUPS */}
            {activeTab === "groups" &&
              (filteredGroups.length === 0 ? (
                <div className="p-6 text-center text-xs text-panel-400">
                  <Hash size={28} className="mx-auto mb-2 text-panel-300" />
                  <p className="font-medium">No groups available</p>
                </div>
              ) : (
                filteredGroups.map((g) => (
                  <button
                    key={g._id}
                    onClick={() => loadGroup(g)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left
                                    border-b border-panel-50 hover:bg-panel-50
                                    transition-colors duration-100
                                    ${
                                      activeGroup?._id === g._id
                                        ? "bg-brand-50 border-l-2 border-l-brand-500"
                                        : ""
                                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full bg-brand-100 flex items-center
                                  justify-center text-brand-700 flex-shrink-0"
                    >
                      <Hash size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-panel-900 truncate">
                        {g.name}
                      </p>
                      <p className="text-[11px] text-panel-500">
                        {g.members.length} members
                      </p>
                    </div>
                    <ArrowRight
                      size={12}
                      className="text-panel-300 flex-shrink-0"
                    />
                  </button>
                ))
              ))}
          </div>
        </div>

        {/* ════════════════════════════
            CHAT AREA
        ════════════════════════════ */}
        <div
          className={`${!showSidebar ? "flex" : "hidden"} md:flex
                         flex-col flex-1 bg-panel-50 min-w-0`}
        >
          {/* Empty */}
          {!active && !activeGroup && (
            <div className="flex-1 flex items-center justify-center text-panel-400">
              <div className="text-center p-8">
                <MessageCircle
                  size={52}
                  className="mx-auto mb-4 text-panel-200"
                />
                <p className="text-sm font-semibold text-panel-600">
                  Select a conversation
                </p>
                <p className="text-xs mt-1 text-panel-400 max-w-xs">
                  All users are listed in the sidebar — click any to start
                  chatting
                </p>
              </div>
            </div>
          )}

          {/* Direct Chat */}
          {active && !activeGroup && (
            <>
              {/* Header */}
              <div
                className="px-4 py-3 bg-white border-b border-panel-100
                              flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowSidebar(true);
                      setActive(null);
                    }}
                    className="md:hidden btn-icon"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  {activeContact && (
                    <ContactAvatar
                      contact={activeContact}
                      isOnline={isOnline(active)}
                      isBlocked={false}
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-panel-900">
                        {displayName(activeContact) || active}
                      </p>
                      {activeContact && (
                        <span className="flex items-center gap-0.5">
                          <RoleIcon role={activeContact.role} />
                          <span
                            className={`text-[9px] font-bold uppercase
                                           ${
                                             activeContact.role === "admin"
                                               ? "text-brand-600"
                                               : activeContact.role === "hr"
                                                 ? "text-blue-500"
                                                 : "text-purple-500"
                                           }`}
                          >
                            {activeContact.role}
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-panel-500">
                      {typingUsers[active] ? (
                        <span className="text-brand-500 font-medium">
                          typing...
                        </span>
                      ) : isOnline(active) ? (
                        <span className="text-green-600 font-medium">
                          Online
                        </span>
                      ) : (
                        "Offline"
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={loadPinned}
                    className="btn-icon text-panel-400 hover:text-brand-600
                                     flex items-center gap-0.5 text-[10px]"
                  >
                    <Pin size={14} />
                  </button>
                  <button
                    onClick={() => setBlockModal(active)}
                    className={`btn-icon flex items-center gap-0.5 text-[10px]
                                     ${
                                       isBlocked(active)
                                         ? "text-red-500 hover:text-red-700"
                                         : "text-panel-400 hover:text-red-500"
                                     }`}
                  >
                    {isBlocked(active) ? (
                      <ShieldOff size={14} />
                    ) : (
                      <Ban size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-panel-400">
                    <div className="text-center">
                      <MessageCircle
                        size={36}
                        className="mx-auto mb-2 text-panel-200"
                      />
                      <p className="text-sm">No messages yet. Say hello! 👋</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble
                      key={msg._id}
                      msg={msg}
                      mine={msg.sender === user?.username}
                      onReply={setReplyTo}
                      onEdit={(m) => {
                        setEditingMsg(m);
                        setEditText(m.content);
                      }}
                      onDelete={setDeleteModal}
                      onReact={(id, type) =>
                        reactToMessage(id, type).catch(() => {})
                      }
                      onPin={(id) => pinMessage(id).catch(() => {})}
                    />
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Reply preview */}
              {replyTo && (
                <div
                  className="px-4 py-2 bg-brand-50 border-t border-brand-100
                                flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <Reply
                      size={13}
                      className="text-brand-500 mt-0.5 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-brand-600">
                        Replying to {replyTo.sender}
                      </p>
                      <p className="text-xs text-panel-500 truncate">
                        {replyTo.content}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="btn-icon p-0.5 flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {isBlocked(active) && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-100">
                  <p className="text-xs text-red-600 flex items-center gap-1.5">
                    <Ban size={11} /> You blocked this user. Unblock to send
                    messages.
                  </p>
                </div>
              )}

              {/* Input */}
              <div className="p-3 bg-white border-t border-panel-100">
                <div className="flex gap-2 items-end">
                  <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={
                      isBlocked(active)
                        ? "Unblock to send messages..."
                        : `Message ${displayName(activeContact) || active}...`
                    }
                    disabled={isBlocked(active)}
                    className="input-field text-sm flex-1"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending || isBlocked(active)}
                    className="btn-primary px-3 py-2.5 flex-shrink-0"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Group Chat */}
          {activeGroup && !active && (
            <>
              <div
                className="px-4 py-3 bg-white border-b border-panel-100
                              flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowSidebar(true);
                      setActiveGroup(null);
                    }}
                    className="md:hidden btn-icon"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div
                    className="w-9 h-9 rounded-full bg-brand-100 flex items-center
                                  justify-center text-brand-700"
                  >
                    <Hash size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-panel-900">
                      {activeGroup.name}
                    </p>
                    <p className="text-[10px] text-panel-500">
                      {groupTypingList.length > 0 ? (
                        <span className="text-brand-500 font-medium">
                          {groupTypingList.join(", ")} typing...
                        </span>
                      ) : (
                        `${activeGroup.members.length} members`
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-panel-400">
                  <Users size={13} /> {activeGroup.members.length}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {groupMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-panel-400">
                    <div className="text-center">
                      <Hash size={36} className="mx-auto mb-2 text-panel-200" />
                      <p className="text-sm">No messages in this group yet</p>
                    </div>
                  </div>
                ) : (
                  groupMessages.map((msg) => (
                    <GroupBubble
                      key={msg._id}
                      msg={msg}
                      mine={msg.sender === user?.username}
                      onReply={setGroupReplyTo}
                    />
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {groupReplyTo && (
                <div
                  className="px-4 py-2 bg-brand-50 border-t border-brand-100
                                flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <Reply
                      size={13}
                      className="text-brand-500 mt-0.5 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-brand-600">
                        Replying to {groupReplyTo.sender}
                      </p>
                      <p className="text-xs text-panel-500 truncate">
                        {groupReplyTo.content}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setGroupReplyTo(null)}
                    className="btn-icon p-0.5 flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <div className="p-3 bg-white border-t border-panel-100">
                <div className="flex gap-2 items-end">
                  <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={`Message ${activeGroup.name}...`}
                    className="input-field text-sm flex-1"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="btn-primary px-3 py-2.5 flex-shrink-0"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal open={!!editingMsg} onClose={() => setEditingMsg(null)}>
        <h3 className="text-sm font-bold text-panel-900 mb-3 flex items-center gap-2">
          <Edit2 size={15} className="text-brand-600" /> Edit Message
        </h3>
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleEdit()}
          className="input-field text-sm"
          autoFocus
        />
        {editingMsg?.originalContent && (
          <p className="text-xs text-panel-400 mt-2 flex items-start gap-1">
            <Info size={12} className="flex-shrink-0 mt-0.5" />
            Original: {editingMsg.originalContent}
          </p>
        )}
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={() => setEditingMsg(null)}
            className="btn-secondary btn-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleEdit}
            disabled={!editText.trim()}
            className="btn-primary btn-sm"
          >
            <Check size={13} /> Save
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 size={17} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-panel-900">
              Delete Message
            </h3>
            <p className="text-sm text-panel-500 mt-1">
              Shows as deleted for both parties.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <button
            onClick={() => setDeleteModal(null)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button onClick={handleDelete} className="btn-danger">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </Modal>

      <Modal open={!!blockModal} onClose={() => setBlockModal(null)}>
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                           ${isBlocked(blockModal) ? "bg-brand-100" : "bg-red-100"}`}
          >
            {isBlocked(blockModal) ? (
              <ShieldOff size={17} className="text-brand-600" />
            ) : (
              <Ban size={17} className="text-red-600" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-panel-900">
              {isBlocked(blockModal) ? "Unblock" : "Block"} {blockModal}?
            </h3>
            <p className="text-sm text-panel-500 mt-1">
              {isBlocked(blockModal)
                ? "You will receive and send messages again."
                : "You won't receive messages from this user."}
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={() => setBlockModal(null)} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleBlock}
            className={isBlocked(blockModal) ? "btn-primary" : "btn-danger"}
          >
            {isBlocked(blockModal) ? (
              <>
                <ShieldOff size={14} /> Unblock
              </>
            ) : (
              <>
                <Ban size={14} /> Block
              </>
            )}
          </button>
        </div>
      </Modal>

      <Modal
        open={pinnedModal}
        onClose={() => setPinnedModal(false)}
        maxWidth="max-w-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-panel-900 flex items-center gap-2">
            <Pin size={14} className="text-brand-600" /> Pinned Messages
          </h3>
          <button
            onClick={() => setPinnedModal(false)}
            className="btn-icon p-1"
          >
            <X size={14} />
          </button>
        </div>
        {pinnedMsgs.length === 0 ? (
          <div className="text-center py-8 text-panel-400">
            <Pin size={28} className="mx-auto mb-2 text-panel-200" />
            <p className="text-sm">No pinned messages</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {pinnedMsgs.map((m) => (
              <div
                key={m._id}
                className="p-3 rounded-lg bg-panel-50 border border-panel-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-brand-600">
                    {m.sender}
                  </span>
                  <span className="text-[10px] text-panel-400 flex items-center gap-1">
                    <Clock size={9} />{" "}
                    {format(new Date(m.createdAt), "MMM d, HH:mm")}
                  </span>
                </div>
                <p className="text-sm text-panel-700 break-words">
                  {m.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════
   CONTACT ITEM — extracted for clarity
═══════════════════════════════════════ */
const ContactItem = ({
  c,
  active,
  loadConversation,
  isOnline,
  isBlocked,
  typingUsers,
  displayName,
}) => {
  const ROLE_COLORS = {
    admin: "bg-brand-100 text-brand-700",
    hr: "bg-blue-100 text-blue-700",
    employee: "bg-purple-100 text-purple-700",
  };

  const initials =
    c.firstName && c.lastName
      ? `${c.firstName[0]}${c.lastName[0]}`
      : c.username[0].toUpperCase();

  const online = isOnline(c.username);
  const blocked = isBlocked(c.username);

  return (
    <button
      onClick={() => loadConversation(c.username)}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left
                  border-b border-panel-50 hover:bg-panel-50
                  transition-colors duration-100
                  ${active === c.username ? "bg-brand-50 border-l-2 border-l-brand-500" : ""}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center
                         text-xs font-bold ${ROLE_COLORS[c.role] || ROLE_COLORS.employee}`}
        >
          {initials}
        </div>
        {online && (
          <Circle
            size={8}
            className="absolute -bottom-0 -right-0 text-green-500
                                      fill-green-500 stroke-white"
            strokeWidth={3}
          />
        )}
        {blocked && (
          <div
            className="absolute -bottom-0 -right-0 w-3 h-3 bg-red-500
                          rounded-full flex items-center justify-center"
          >
            <Ban size={7} className="text-white" />
          </div>
        )}
        {c.isVirtual && !online && (
          <div
            className="absolute -bottom-0 -right-0 w-3 h-3 bg-panel-300
                          rounded-full flex items-center justify-center"
          >
            <UserCircle size={7} className="text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold text-panel-900 truncate">
            {displayName(c)}
          </span>
          <span
            className={`text-[9px] uppercase font-bold flex-shrink-0
                            ${
                              c.role === "admin"
                                ? "text-brand-600"
                                : c.role === "hr"
                                  ? "text-blue-500"
                                  : "text-purple-500"
                            }`}
          >
            {c.role}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[11px] text-panel-500 truncate max-w-[130px]">
            {typingUsers[c.username] ? (
              <span className="text-brand-500 italic">typing...</span>
            ) : c.lastMessage ? (
              c.lastMessage
            ) : online ? (
              <span className="text-green-600">Online now</span>
            ) : c.position ? (
              <span className="text-panel-400">{c.position}</span>
            ) : (
              "Start a conversation"
            )}
          </p>
          {c.unread > 0 && (
            <span
              className="w-4 h-4 bg-brand-600 text-white text-[9px] font-bold
                             rounded-full flex items-center justify-center flex-shrink-0"
            >
              {c.unread > 9 ? "9+" : c.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default Messages;
