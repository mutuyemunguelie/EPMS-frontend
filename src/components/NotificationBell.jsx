import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell, X, Check, Send, ChevronDown, ChevronUp,
  Trash2, Trash, ThumbsUp, Shield, Users, MessageCircle,
  CheckCheck,
} from "lucide-react";
import {
  getNotifications, markAllNotificationsRead, markNotificationRead,
  deleteNotification, deleteAllNotifications, deleteSelectedNotifications,
  getNotificationReplies, addNotificationReply, reactToNotificationReply,
} from "../api/notificationAPI";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const EMOJIS = ["👍", "❤️", "😊", "🎉", "👏", "😮"];

const TYPE_ICON = {
  message:        { icon: "💬", bg: "bg-blue-100" },
  system:         { icon: "📢", bg: "bg-brand-100" },
  setting_change: { icon: "⚙️", bg: "bg-amber-100" },
  salary_posted:  { icon: "💰", bg: "bg-green-100" },
  employee_added: { icon: "👤", bg: "bg-purple-100" },
  default:        { icon: "🔔", bg: "bg-panel-100" },
};

/* Single notification item */
const NotifItem = ({
  notif, onRead, onDelete, onSelect, selected, currentUser, onMessageSender
}) => {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(null);

  const typeInfo = TYPE_ICON[notif.type] || TYPE_ICON.default;

  const loadReplies = useCallback(async () => {
    setLoadingReplies(true);
    try {
      const res = await getNotificationReplies(notif._id);
      setReplies(res.data.data || []);
    } catch {}
    finally { setLoadingReplies(false); }
  }, [notif._id]);

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadReplies();
    if (!notif.read) onRead(notif._id);
  };

  const handleReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await addNotificationReply(notif._id, replyText.trim());
      setReplies((p) => [...p, res.data.data]);
      setReplyText("");
    } catch {}
    finally { setSending(false); }
  };

  const handleReact = async (replyId, emoji) => {
    try {
      const res = await reactToNotificationReply(notif._id, replyId, emoji);
      setReplies((p) => p.map((r) => r._id === replyId ? res.data.data : r));
    } catch {}
    setShowEmoji(null);
  };

  const roleIcon = (role) =>
    role === "admin" ? <Shield size={9} className="text-brand-600" />
    : role === "hr" ? <Users size={9} className="text-blue-500" />
    : null;

  return (
    <div className={`border-b border-panel-50 transition-colors duration-100
                     ${!notif.read ? "bg-brand-50/20" : ""}
                     ${selected ? "bg-blue-50/30" : ""}`}>
      <div className="flex items-start gap-2 px-3 py-2.5">
        {/* Select checkbox */}
        <input type="checkbox" checked={selected}
               onChange={() => onSelect(notif._id)}
               className="mt-1 flex-shrink-0 accent-brand-600" />

        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                         flex-shrink-0 text-sm ${typeInfo.bg}`}>
          {typeInfo.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className={`text-xs leading-snug ${!notif.read
              ? "font-semibold text-panel-900" : "font-medium text-panel-700"}`}>
              {notif.title}
            </p>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
              )}
              <button onClick={() => onDelete(notif._id)}
                      className="text-panel-300 hover:text-red-500 transition-colors p-0.5">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-panel-500 mt-0.5 line-clamp-2">{notif.body}</p>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[10px] text-panel-400">
              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
            </span>

            {/* Message sender button */}
            {notif.sender && notif.sender !== currentUser && (
              <button onClick={() => onMessageSender(notif.sender)}
                      className="flex items-center gap-0.5 text-[10px] text-blue-600
                                 hover:text-blue-700 font-medium transition-colors">
                <MessageCircle size={10} /> Message {notif.sender}
              </button>
            )}

            {/* Reply/comments toggle */}
            {(notif.allowReplies || notif.replyCount > 0) && (
              <button onClick={handleExpand}
                      className="flex items-center gap-0.5 text-[10px] text-brand-600
                                 hover:text-brand-700 font-medium transition-colors">
                {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {notif.replyCount > 0 ? `${notif.replyCount} comment${notif.replyCount !== 1 ? "s" : ""}` : "Comment"}
              </button>
            )}

            {!notif.read && (
              <button onClick={() => onRead(notif._id)}
                      className="text-[10px] text-panel-400 hover:text-brand-600 transition-colors">
                <Check size={10} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded replies */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-panel-100 pt-2 ml-4">
          {loadingReplies ? (
            <p className="text-xs text-panel-400 text-center py-2">Loading...</p>
          ) : (
            replies.map((r) => (
              <div key={r._id} className="flex items-start gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center
                                 text-[9px] font-bold flex-shrink-0
                                 ${r.authorRole === "admin"
                                   ? "bg-brand-100 text-brand-700"
                                   : r.authorRole === "hr"
                                   ? "bg-blue-100 text-blue-700"
                                   : "bg-purple-100 text-purple-700"}`}>
                  {r.author[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-panel-50 rounded-lg px-2.5 py-2">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[10px] font-semibold text-panel-800">{r.author}</span>
                      {roleIcon(r.authorRole)}
                    </div>
                    <p className="text-xs text-panel-700 break-words">{r.content}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 pl-1">
                    <span className="text-[9px] text-panel-400">
                      {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </span>
                    {r.reactions?.length > 0 && (
                      <div className="flex gap-0.5">
                        {Object.entries(
                          r.reactions.reduce((acc, rx) => {
                            acc[rx.emoji] = (acc[rx.emoji] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([emoji, count]) => (
                          <span key={emoji}
                                className="text-[10px] bg-white border border-panel-200
                                           rounded-full px-1 py-0.5">
                            {emoji} {count}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="relative">
                      <button onClick={() => setShowEmoji(showEmoji === r._id ? null : r._id)}
                              className="text-[10px] text-panel-400 hover:text-brand-600 transition-colors">
                        <ThumbsUp size={9} />
                      </button>
                      {showEmoji === r._id && (
                        <div className="absolute bottom-5 left-0 flex gap-1 bg-white
                                        border border-panel-200 rounded-lg p-1.5 shadow-card-md z-20">
                          {EMOJIS.map((e) => (
                            <button key={e}
                                    onClick={() => handleReact(r._id, e)}
                                    className="text-sm hover:scale-125 transition-transform">
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Reply input */}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center
                            justify-center text-[9px] font-bold flex-shrink-0 text-brand-700">
              {currentUser?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 flex gap-1">
              <input type="text" value={replyText}
                     onChange={(e) => setReplyText(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && handleReply()}
                     placeholder="Write a comment..."
                     className="input-field text-xs py-1.5 flex-1" />
              <button onClick={handleReply}
                      disabled={!replyText.trim() || sending}
                      className="btn-primary px-2 py-1.5">
                <Send size={11} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Main Bell */
const NotificationBell = () => {
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef(null);
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifs(res.data.data || []);
      setUnread(res.data.unread || 0);
    } catch {}
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  useEffect(() => {
    if (!socket) return;
    const onNew = () => fetchNotifs();
    const onReply = ({ notificationId, reply }) => {
      setNotifs((p) =>
        p.map((n) =>
          n._id === notificationId
            ? { ...n, replyCount: (n.replyCount || 0) + 1 }
            : n
        )
      );
    };
    socket.on("new_notification", onNew);
    socket.on("notification_reply", onReply);
    return () => {
      socket.off("new_notification", onNew);
      socket.off("notification_reply", onReply);
    };
  }, [socket, fetchNotifs]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkOne = async (id) => {
    await markNotificationRead(id);
    setNotifs((p) => p.map((n) => n._id === id ? { ...n, read: true } : n));
    setUnread((p) => Math.max(0, p - 1));
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifs((p) => p.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const handleDeleteOne = async (id) => {
    await deleteNotification(id);
    setNotifs((p) => p.filter((n) => n._id !== id));
    setSelected((p) => p.filter((s) => s !== id));
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      await deleteAllNotifications();
      setNotifs([]);
      setUnread(0);
      setSelected([]);
    } catch {}
    finally { setDeleting(false); }
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    try {
      await deleteSelectedNotifications(selected);
      setNotifs((p) => p.filter((n) => !selected.includes(n._id)));
      setSelected([]);
    } catch {}
  };

  const handleSelect = (id) => {
    setSelected((p) =>
      p.includes(id) ? p.filter((s) => s !== id) : [...p, id]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === notifs.length) {
      setSelected([]);
    } else {
      setSelected(notifs.map((n) => n._id));
    }
  };

  /* Navigate to messages and open conversation with sender */
  const handleMessageSender = (sender) => {
    setOpen(false);
    navigate(`/messages?open=${sender}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="btn-icon relative">
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500
                           text-white text-[9px] font-bold rounded-full
                           flex items-center justify-center animate-scale-in">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-[26rem] card shadow-card-lg
                        animate-slide-down z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5
                          border-b border-panel-100">
            <h3 className="text-sm font-bold text-panel-900 flex items-center gap-1.5">
              <Bell size={14} className="text-brand-600" />
              Notifications
              {unread > 0 && (
                <span className="text-[10px] bg-red-100 text-red-600
                                 px-1.5 py-0.5 rounded-full font-bold">
                  {unread}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={handleMarkAll}
                        className="text-[10px] text-brand-600 hover:text-brand-700
                                   font-medium flex items-center gap-0.5 transition-colors
                                   px-2 py-1 rounded hover:bg-brand-50">
                  <CheckCheck size={11} /> All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="btn-icon p-1">
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Bulk actions */}
          {notifs.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-panel-100 bg-panel-50">
              <input type="checkbox"
                     checked={selected.length === notifs.length && notifs.length > 0}
                     onChange={handleSelectAll}
                     className="accent-brand-600" />
              <span className="text-xs text-panel-500">
                {selected.length > 0 ? `${selected.length} selected` : "Select all"}
              </span>
              <div className="flex items-center gap-1 ml-auto">
                {selected.length > 0 && (
                  <button onClick={handleDeleteSelected}
                          className="flex items-center gap-1 text-xs text-red-600
                                     hover:text-red-700 font-medium px-2 py-1
                                     rounded hover:bg-red-50 transition-colors">
                    <Trash2 size={11} /> Delete ({selected.length})
                  </button>
                )}
                <button onClick={handleDeleteAll} disabled={deleting}
                        className="flex items-center gap-1 text-xs text-red-500
                                   hover:text-red-600 font-medium px-2 py-1
                                   rounded hover:bg-red-50 transition-colors">
                  <Trash size={11} /> {deleting ? "..." : "Clear all"}
                </button>
              </div>
            </div>
          )}

          {/* Notification list */}
          <div className="max-h-[70vh] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-10 text-center text-panel-400">
                <Bell size={28} className="mx-auto mb-2 text-panel-200" />
                <p className="text-xs">No notifications</p>
              </div>
            ) : (
              notifs.map((n) => (
                <NotifItem
                  key={n._id}
                  notif={n}
                  onRead={handleMarkOne}
                  onDelete={handleDeleteOne}
                  onSelect={handleSelect}
                  selected={selected.includes(n._id)}
                  currentUser={user?.username}
                  onMessageSender={handleMessageSender}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;