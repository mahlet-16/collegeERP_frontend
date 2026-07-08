import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api, getList } from "../api/client";
import logoImage from "../assets/cpu-college-logo.svg";
import Icon from "./Icons";

export default function Layout({ children }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [prevUnreadIds, setPrevUnreadIds] = useState(new Set());
  const [toastNotification, setToastNotification] = useState(null);
  const [activeNotification, setActiveNotification] = useState(null);

  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Guest";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const loadNotifications = async (isInitial = false) => {
    if (!user) return;
    try {
      const res = await api.get("/users/notifications/");
      const list = getList(res.data);
      setNotifications(list);

      const unread = list.filter((n) => !n.read);
      const unreadIds = new Set(unread.map((n) => n.id));

      if (!isInitial && prevUnreadIds.size > 0) {
        const newlyArrived = unread.find((n) => !prevUnreadIds.has(n.id));
        if (newlyArrived) {
          setToastNotification(newlyArrived);
          setTimeout(() => {
            setToastNotification((prev) => (prev?.id === newlyArrived.id ? null : prev));
          }, 8000);
        }
      }

      setPrevUnreadIds(new Set(unread.map((n) => n.id)));
    } catch (err) {
      console.error("Could not load notifications", err);
    }
  };

  useEffect(() => {
    loadNotifications(true);
    const interval = setInterval(() => loadNotifications(false), 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/users/notifications/${id}/mark_read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setPrevUnreadIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleOpenNotification = async (notif) => {
    setActiveNotification(notif);
    setDropdownOpen(false);
    setToastNotification(null);
    if (!notif.read) {
      await handleMarkRead(notif.id);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    try {
      await Promise.all(unread.map((n) => api.post(`/users/notifications/${n.id}/mark_read/`)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setPrevUnreadIds(new Set());
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-frame">
        <header className="top-nav">
          <div className="top-nav-brand">
            <img src={logoImage} alt="CPU College logo" className="top-nav-logo" />
            <div>
              <span className="eyebrow">Academic Command Center</span>
              <h1>{roleLabel} Workspace</h1>
            </div>
          </div>
          <div className="top-actions">
            <div className="top-chip top-date">
              <strong>{today}</strong>
              <span>Live session</span>
            </div>
            <div className="top-chip">
              <strong>{user?.username || "Unknown"}</strong>
              <span>{roleLabel}</span>
            </div>
            
            <div className="notification-bell-container">
              <button
                type="button"
                className={`notification-bell-btn ${unreadCount > 0 ? "has-unread" : ""}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                title="Notifications"
              >
                <Icon name="notifications" />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              {dropdownOpen && (
                <div className="notification-dropdown">
                  <div className="notification-dropdown-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="mark-all-read-btn">
                        Mark all
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">No notifications</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={`notification-item ${!n.read ? "unread" : ""}`}
                          onClick={() => handleOpenNotification(n)}
                        >
                          <div className="notification-item-title">{n.title}</div>
                          <div className="notification-item-message">{n.message}</div>
                          <div className="notification-item-time">
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button type="button" className="theme-toggle-header" onClick={toggleTheme} title="Toggle theme">
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </button>
            <button type="button" className="logout-btn-header" onClick={signOut} title="Sign out">
              <Icon name="logout" />
            </button>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>

      {toastNotification && (
        <div className="notification-toast" onClick={() => handleOpenNotification(toastNotification)}>
          <div className="notification-toast-header">
            <span className="notification-toast-title">{toastNotification.title}</span>
            <button
              className="notification-toast-close"
              onClick={(e) => {
                e.stopPropagation();
                setToastNotification(null);
              }}
            >
              &times;
            </button>
          </div>
          <p className="notification-toast-message">{toastNotification.message}</p>
        </div>
      )}

      {activeNotification && (
        <div className="notification-modal-overlay" onClick={() => setActiveNotification(null)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{activeNotification.title}</h2>
            <div className="notification-modal-body">
              <p>{activeNotification.message}</p>
              <small style={{ color: "var(--muted)" }}>
                {new Date(activeNotification.created_at).toLocaleString()}
              </small>
            </div>
            <div className="notification-modal-actions">
              <button className="notification-modal-close-btn" onClick={() => setActiveNotification(null)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
