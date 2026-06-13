import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { Icon } from "@iconify/react";
import { useThemeMode } from "../themeprovider/ThemeContext";
import axios from "axios";
import { useRouter } from "next/navigation";
import NotificationPopover from "./NotificationPopover";
import {
  getTopbarActionSx,
  POLLING_INTERVAL_MS,
} from "./TopMenu.helpers";

const isInternalUrl = (url) => typeof url === "string" && url.startsWith("/");

const wait = (duration) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

const getNotificationTargetUrl = (notification, user) => {
  const isTenantTermination =
    notification?.entity_type === "tenant_termination" ||
    notification?.type?.startsWith("tenant_termination");
  const isTenantApplication =
    notification?.entity_type === "tenant_application" ||
    notification?.type?.startsWith("tenant_application") ||
    notification?.type?.startsWith("tenant_approval");
  const progressTerminationNotificationTypes = new Set([
    "tenant_termination_created",
    "tenant_termination_progress",
    "tenant_termination_approval_completed",
    "tenant_termination_rejected_by_you",
    "tenant_termination_approved",
    "tenant_termination_rejected",
  ]);
  const progressApprovalNotificationTypes = new Set([
    "tenant_approval_progress",
    "tenant_approval_completed",
    "tenant_approval_rejected_by_you",
    "tenant_application_approved",
    "tenant_application_rejected",
  ]);

  if (isTenantTermination && notification?.entity_id) {
    const deletedParam =
      notification.type === "tenant_termination_deleted" ? "&deleted=1" : "";
    const isAdminContract = [1, 2].includes(Number(user?.role_id));
    const openMode =
      notification.type === "tenant_termination_waiting"
        ? "detail"
        : progressTerminationNotificationTypes.has(notification.type)
        ? "progress"
        : "detail";
    const basePath = isAdminContract
      ? "/tenant-terminations"
      : "/tenant-terminations-approval";

    return `${basePath}?tenant_early_termination_id=${notification.entity_id}&open=${openMode}${deletedParam}`;
  }

  if (
    progressApprovalNotificationTypes.has(notification?.type) &&
    notification?.entity_id
  ) {
    /**
     * Admin Kontrak memantau progress dari menu Tenant Application, sedangkan
     * role approval memakai menu Tenant Approval sesuai akses middleware.
     */
    if ([1, 2].includes(Number(user?.role_id))) {
      return `/tenant-application?tenant_application_id=${notification.entity_id}&open=approval`;
    }

    if ([3, 4, 5, 6, 7].includes(Number(user?.role_id))) {
      return `/tenant-approval?tenant_application_id=${notification.entity_id}&open=progress`;
    }

    return notification?.action_url;
  }

  if (isTenantApplication && [1, 2].includes(Number(user?.role_id)) && notification?.entity_id) {
    const deletedParam =
      notification.type === "tenant_application_deleted" ? "&deleted=1" : "";
    const openMode =
      notification.type === "tenant_application_deleted" ? "detail" : "approval";

    return `/tenant-application?tenant_application_id=${notification.entity_id}&open=${openMode}${deletedParam}`;
  }

  /**
   * Semua notifikasi yang terkait permohonan sewa diarahkan ke halaman approval.
   * Halaman tersebut akan membuka modal detail kalau datanya masih ada, atau
   * menampilkan snackbar kalau data sudah dihapus.
   */
  if (isTenantApplication && notification?.entity_id) {
    const deletedParam =
      notification.type === "tenant_application_deleted" ? "&deleted=1" : "";
    return `/tenant-approval?tenant_application_id=${notification.entity_id}&open=approval${deletedParam}`;
  }

  if (notification?.entity_type === "payment" && notification?.entity_id) {
    const deletedParam = notification.type === "payment_deleted" ? "&deleted=1" : "";
    const progressPaymentNotificationTypes = new Set([
      "payment_approved",
      "payment_rejected",
    ]);
    const openMode = progressPaymentNotificationTypes.has(notification.type)
      ? "progress"
      : "detail";

    return `/payments?payment_id=${notification.entity_id}&open=${openMode}${deletedParam}`;
  }

  return notification?.action_url;
};

const persistTenantApprovalTarget = (targetUrl) => {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(targetUrl, window.location.origin);
    const tenantApplicationId = url.searchParams.get("tenant_application_id");

    if (!tenantApplicationId) return;

    /**
     * Session storage dipakai agar halaman tenant approval tetap tahu data mana
     * yang harus dibuka setelah navigasi selesai, termasuk saat user sudah berada
     * di halaman yang sama dan hanya query parameter yang berubah.
     */
    window.sessionStorage.setItem(
      "sewain:tenant-approval-target",
      JSON.stringify({
        tenantApplicationId: Number(tenantApplicationId),
        openMode: url.searchParams.get("open") || "approval",
        deleted: url.searchParams.get("deleted") === "1",
        requestedAt: Date.now(),
      }),
    );
  } catch (err) {
    console.log("Error persist tenant approval notification target", err);
  }
};

const persistPaymentTarget = (targetUrl) => {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(targetUrl, window.location.origin);
    const paymentId = url.searchParams.get("payment_id");

    if (!paymentId) return;

    window.sessionStorage.setItem(
      "sewain:payment-target",
      JSON.stringify({
        paymentId: Number(paymentId),
        openMode: url.searchParams.get("open") || "detail",
        deleted: url.searchParams.get("deleted") === "1",
        requestedAt: Date.now(),
      }),
    );
  } catch (err) {
    console.log("Error persist payment notification target", err);
  }
};

const persistTenantApplicationTarget = (targetUrl) => {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(targetUrl, window.location.origin);
    const tenantApplicationId = url.searchParams.get("tenant_application_id");

    if (!tenantApplicationId) return;

    window.sessionStorage.setItem(
      "sewain:tenant-application-target",
      JSON.stringify({
        tenantApplicationId: Number(tenantApplicationId),
        openMode: url.searchParams.get("open") || "detail",
        deleted: url.searchParams.get("deleted") === "1",
        requestedAt: Date.now(),
      }),
    );
  } catch (err) {
    console.log("Error persist tenant application notification target", err);
  }
};

const persistTenantTerminationTarget = (targetUrl) => {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(targetUrl, window.location.origin);
    const tenantEarlyTerminationId = url.searchParams.get(
      "tenant_early_termination_id",
    );

    if (!tenantEarlyTerminationId) return;

    window.sessionStorage.setItem(
      "sewain:tenant-termination-target",
      JSON.stringify({
        tenantEarlyTerminationId: Number(tenantEarlyTerminationId),
        openMode: url.searchParams.get("open") || "detail",
        deleted: url.searchParams.get("deleted") === "1",
        requestedAt: Date.now(),
      }),
    );
  } catch (err) {
    console.log("Error persist tenant termination notification target", err);
  }
};

const isTenantApprovalUrl = (url) =>
  typeof url === "string" && url.startsWith("/tenant-approval");

const isPaymentUrl = (url) =>
  typeof url === "string" && url.startsWith("/payments");

const isTenantApplicationUrl = (url) =>
  typeof url === "string" && url.startsWith("/tenant-application");

const isTenantTerminationUrl = (url) =>
  typeof url === "string" &&
  (url.startsWith("/tenant-terminations") ||
    url.startsWith("/tenant-terminations-approval"));

/**
 * Top application bar for protected pages.
 * Komponen ini mengelola state global yang memang hidup di topbar: theme mode,
 * polling notifikasi, menu akun, dan loading saat navigasi dari notifikasi.
 */
const TopMenu = ({
  user,
  onBurgerClick,
  onShowLoading,
  onHideLoading,
  setLoadingMessage,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:1300px)");
  const isSmallScreen = useMediaQuery("(max-width:600px)");
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationActionLoading, setNotificationActionLoading] =
    useState(false);
  const [notificationTab, setNotificationTab] = useState("all");
  const open = Boolean(anchorEl);
  const notificationOpen = Boolean(notificationAnchorEl);
  const { themeMode, setThemeMode } = useThemeMode();
  const router = useRouter();

  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const fetchNotifications = useCallback(
    async ({ unreadOnly = notificationTab === "unread", silent = false } = {}) => {
      if (!user?.id) return;

      if (!silent) {
        setNotificationLoading(true);
      }

      try {
        const response = await axios.get("/api/notifications", {
          params: {
            unreadOnly,
            limit: 30,
          },
        });

        if (response.data?.success) {
          setNotifications(response.data.data || []);
          setUnreadCount(response.data.unread_count || 0);
        }
      } catch (err) {
        // Endpoint notifikasi tidak boleh mengganggu navigasi utama aplikasi.
        // Error cukup dicatat agar UI top menu tetap bisa dipakai.
        console.log("Error fetch notifications", err);
      } finally {
        if (!silent) {
          setNotificationLoading(false);
        }
      }
    },
    [notificationTab, user?.id],
  );

  useEffect(() => {
    fetchNotifications({ unreadOnly: false, silent: true });
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const intervalId = setInterval(() => {
      fetchNotifications({ unreadOnly: notificationTab === "unread", silent: true });
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchNotifications, notificationTab, user?.id]);

  useEffect(() => {
    const handleRefreshNotifications = () => {
      fetchNotifications({
        unreadOnly: notificationTab === "unread",
        silent: true,
      });
    };

    window.addEventListener("sewain:notifications-refresh", handleRefreshNotifications);
    window.addEventListener("focus", handleRefreshNotifications);

    return () => {
      window.removeEventListener(
        "sewain:notifications-refresh",
        handleRefreshNotifications,
      );
      window.removeEventListener("focus", handleRefreshNotifications);
    };
  }, [fetchNotifications, notificationTab]);

  const handleLogout = async () => {
    onShowLoading?.();
    try {
      sessionStorage.removeItem("sewain:session-expires-at");
      await axios.post("/api/logout");
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err) {
      console.log("error logout", err);
      onHideLoading?.();
    }
  };

  const handleProfile = () => {
    onShowLoading?.();
    setTimeout(() => {
      router.push("/account");
      onHideLoading?.();
    }, 1000);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
    fetchNotifications({ unreadOnly: notificationTab === "unread" });
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const refreshAfterMutation = async () => {
    await fetchNotifications({ unreadOnly: notificationTab === "unread", silent: true });
  };

  const handleMarkAllRead = async () => {
    setNotificationActionLoading(true);
    setLoadingMessage?.("Menandai notifikasi sebagai sudah dibaca...");
    onShowLoading?.();
    try {
      await axios.put("/api/notifications/mark-all-read");
      await wait(500);
      setUnreadCount(0);
      if (notificationTab === "unread") {
        setNotifications([]);
      } else {
        setNotifications((prev) =>
          prev.map((item) => ({
            ...item,
            read_at: item.read_at || new Date().toISOString(),
          })),
        );
      }
      await refreshAfterMutation();
    } catch (err) {
      console.log("Error mark all notifications as read", err);
    } finally {
      setNotificationActionLoading(false);
      onHideLoading?.();
    }
  };

  const handleArchiveAll = async () => {
    setNotificationActionLoading(true);
    setLoadingMessage?.("Membersihkan daftar notifikasi...");
    onShowLoading?.();
    try {
      await axios.put("/api/notifications/archive-all");
      await wait(500);
      await refreshAfterMutation();
    } catch (err) {
      console.log("Error archive all notifications", err);
    } finally {
      setNotificationActionLoading(false);
      onHideLoading?.();
    }
  };

  const handleArchiveNotification = async (event, notificationId) => {
    event.stopPropagation();
    setNotificationActionLoading(true);
    setLoadingMessage?.("Membersihkan notifikasi...");
    onShowLoading?.();

    try {
      await axios.put(`/api/notifications/${notificationId}/archive`);
      await wait(500);
      await refreshAfterMutation();
    } catch (err) {
      console.log("Error archive notification", err);
    } finally {
      setNotificationActionLoading(false);
      onHideLoading?.();
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      const targetUrl = getNotificationTargetUrl(notification, user);

      setLoadingMessage?.(
        notification.entity_type === "payment"
          ? "Menampilkan detail pembayaran..."
          : notification.entity_type === "tenant_termination"
          ? "Menampilkan data nonaktif tenant..."
          : isTenantApplicationUrl(targetUrl)
          ? "Menampilkan detail permohonan..."
          : "Menampilkan data permohonan...",
      );
      onShowLoading?.();

      if (!notification.read_at) {
        await axios.put(`/api/notifications/${notification.id}/read`);
      }

      handleNotificationClose();
      await refreshAfterMutation();
      await wait(1000);

      // action_url hanya boleh URL internal untuk mencegah open redirect.
      if (isInternalUrl(targetUrl)) {
        persistTenantApprovalTarget(targetUrl);
        persistTenantApplicationTarget(targetUrl);
        persistTenantTerminationTarget(targetUrl);
        persistPaymentTarget(targetUrl);
        router.push(targetUrl);
        window.dispatchEvent(new Event("sewain:tenant-approval-notification-open"));
        window.dispatchEvent(new Event("sewain:tenant-application-notification-open"));
        window.dispatchEvent(new Event("sewain:tenant-termination-notification-open"));
        window.dispatchEvent(new Event("sewain:payment-notification-open"));

        /**
         * Untuk notifikasi approval, loading dimatikan oleh halaman tujuan setelah
         * modal detail/snackbar sudah benar-benar muncul. Ini mencegah jeda kosong
         * saat navigasi dari dashboard ke tenant approval masih berlangsung.
         */
        if (
          !isTenantApprovalUrl(targetUrl) &&
          !isTenantApplicationUrl(targetUrl) &&
          !isTenantTerminationUrl(targetUrl) &&
          !isPaymentUrl(targetUrl)
        ) {
          onHideLoading?.();
        }
      } else {
        onHideLoading?.();
      }
    } catch (err) {
      console.log("Error open notification", err);
      onHideLoading?.();
    }
  };

  const visibleNotifications =
    notificationTab === "unread"
      ? notifications.filter((notification) => !notification.read_at)
      : notifications;

  return (
    <Paper
      elevation={0}
      sx={{
        px: { xs: 1.5, sm: 2 },
        py: 1,
        minHeight: 64,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: isMobile ? "space-between" : "flex-end",
        gap: 2,
        position: "sticky",
        top: 0,
        zIndex: 20,
        bgcolor: theme.ui.topbarBg,
        color: "text.primary",
        borderRadius: 0,
        borderBottom: `1px solid ${theme.ui.topbarBorder}`,
        boxShadow: "none",
        backdropFilter: "blur(16px)",
        transition: "background-color 0.3s ease, border-color 0.3s ease",
      }}
    >
      {isMobile && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            onClick={onBurgerClick}
            edge="start"
            aria-label="open drawer"
            sx={{
              minHeight: 40,
              px: 1.25,
              borderRadius: 2,
              color: theme.palette.primary.main,
              display: "flex",
              alignItems: "center",
              gap: 1,
              textTransform: "capitalize",
              bgcolor: theme.ui.iconButtonBg,
              border: `1px solid ${theme.ui.navBorder}`,
              "&:hover": {
                bgcolor: theme.ui.iconButtonHover,
              },
            }}
          >
            <MenuIcon />
            <Typography
              sx={{
                display: { xs: "none", sm: "block" },
                fontFamily: "poppins",
                fontWeight: 800,
              }}
            >
              Menu
            </Typography>
          </Button>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: { xs: 1, sm: 1.25 },
        }}
      >
        <Tooltip title={themeMode === "dark" ? "Dark Mode" : "Light Mode"}>
          <IconButton
            onClick={() => {
              setThemeMode(themeMode === "dark" ? "light" : "dark");
              localStorage.setItem(
                "currentTheme",
                JSON.stringify({
                  currentThemeMode: themeMode === "dark" ? "light" : "dark",
                }),
              );
            }}
            aria-label="toggle theme"
            sx={getTopbarActionSx(theme)}
          >
            {themeMode === "dark" ? (
              <Icon icon="line-md:moon-rising-filled-loop" fontSize="22px" />
            ) : (
              <Icon
                icon="line-md:moon-filled-alt-to-sunny-filled-loop-transition"
                fontSize="22px"
              />
            )}
          </IconButton>
        </Tooltip>

        <Tooltip title="Notifikasi">
          <IconButton
            onClick={handleNotificationOpen}
            size="small"
            aria-label="open notifications"
            sx={getTopbarActionSx(theme)}
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              max={99}
              overlap="circular"
            >
              <Icon
                icon="line-md:bell-filled-loop"
                color={theme.palette.primary.main}
                fontSize="23px"
              />
            </Badge>
          </IconButton>
        </Tooltip>

        <NotificationPopover
          anchorEl={notificationAnchorEl}
          open={notificationOpen}
          onClose={handleNotificationClose}
          isSmallScreen={isSmallScreen}
          notifications={notifications}
          visibleNotifications={visibleNotifications}
          unreadCount={unreadCount}
          notificationLoading={notificationLoading}
          notificationActionLoading={notificationActionLoading}
          notificationTab={notificationTab}
          onTabChange={(event, value) => {
            setNotificationTab(value);
            fetchNotifications({ unreadOnly: value === "unread" });
          }}
          onNotificationClick={handleNotificationClick}
          onArchiveNotification={handleArchiveNotification}
          onMarkAllRead={handleMarkAllRead}
          onArchiveAll={handleArchiveAll}
        />

        <Tooltip title="Settings">
          <IconButton
            onClick={handleAvatarClick}
            size="small"
            sx={getTopbarActionSx(theme)}
          >
            <Icon
              icon="line-md:cog-loop"
              color={theme.palette.primary.main}
              fontSize="25px"
            />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              minWidth: 190,
              borderRadius: 2.5,
              bgcolor: theme.ui.menuPaperBg,
              border: `1px solid ${theme.ui.navBorder}`,
              boxShadow: theme.ui.shellShadow,
              overflow: "hidden",
            },
          }}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem onClick={handleProfile}>
            <PersonIcon fontSize="small" sx={{ mr: 1.5 }} />
            Profil
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Paper>
  );
};

export default TopMenu;
