import api from "./api";

/** Récupérer les notifications de l'utilisateur connecté */
export const getNotifications = () => api.get("/notifications");

/** Compter les notifications non lues */
export const getUnreadCount = () => api.get("/notifications/unread-count");

/** Marquer une notification comme lue */
export const markAsRead = (id) => api.put(`/notifications/${id}/read`);

/** Marquer toutes les notifications comme lues */
export const markAllAsRead = () => api.put("/notifications/read-all");