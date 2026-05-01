import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

const useForceLogout = () => {
  const { logout, user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    /* Force logout */
    const onForceLogout = ({ reason }) => {
      alert(reason || "You have been logged out.");
      logout();
      navigate("/login");
    };

    /* Setting enforced — redirect + warn */
    const onEnforceSetting = ({ key, message }) => {
      if (key === "cross_dept_chat_enabled" && user?.role === "employee") {
        alert(message || "A setting was changed by admin.");
        navigate("/dashboard");
      }
    };

    /* Permissions updated */
    const onPermissionsUpdated = (perms) => {
      try {
        const stored = sessionStorage.getItem("epms_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.permissions = perms;
          sessionStorage.setItem("epms_user", JSON.stringify(parsed));
        }
      } catch {}
    };

    socket.on("force_logout", onForceLogout);
    socket.on("enforce_setting", onEnforceSetting);
    socket.on("permissions_updated", onPermissionsUpdated);

    return () => {
      socket.off("force_logout", onForceLogout);
      socket.off("enforce_setting", onEnforceSetting);
      socket.off("permissions_updated", onPermissionsUpdated);
    };
  }, [socket, logout, navigate, user?.role]);
};

export default useForceLogout;