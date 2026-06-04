import React, { useCallback, useEffect, useState } from "react";
import {
  alpha,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Stack,
  Tab,
  Tabs,
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
import NotificationMessage, {
  getNotificationTitle,
} from "../notifications/NotificationMessage";

const POLLING_INTERVAL_MS = 10000;

const priorityColor = {
  low: "default",
  normal: "primary",
  high: "warning",
  urgent: "error",
};

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
      sx={{
        p: 2,
        height: "55px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: isMobile ? "space-between" : "flex-end",
        transition: "all 0.3s",
        borderRadius: "0px",
      }}
    >
      {isMobile && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            onClick={onBurgerClick}
            edge="start"
            aria-label="open drawer"
            sx={{
              m: 0,
              p: 0,
              color: theme.palette.primary.main,
              display: "flex",
              alignItems: "center",
              gap: 1,
              textTransform: "capitalize",
            }}
          >
            <MenuIcon />
            <Typography sx={{ fontFamily: "poppins", fontWeight: "bold" }}>
              Menu
            </Typography>
          </Button>
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
            sx={{
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              transition: "background-color 0.3s, color 0.3s",
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
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
            sx={{
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
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
                fontSize="25px"
              />
            </Badge>
          </IconButton>
        </Tooltip>

        <Popover
          open={notificationOpen}
          anchorEl={notificationAnchorEl}
          onClose={handleNotificationClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              mt: 1.5,
              width: isSmallScreen ? "calc(100vw - 24px)" : 390,
              maxWidth: "calc(100vw - 24px)",
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "background.paper",
              color: "text.primary",
              border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            },
          }}
        >
          <Box sx={{ p: 2, pb: 1.25 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
            >
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                  Notifikasi
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  {unreadCount} belum dibaca
                </Typography>
              </Box>
              {notificationLoading && <CircularProgress size={18} />}
            </Stack>

            <Tabs
              value={notificationTab}
              onChange={(event, value) => {
                setNotificationTab(value);
                fetchNotifications({ unreadOnly: value === "unread" });
              }}
              variant="fullWidth"
              sx={{ minHeight: 36, mt: 1 }}
            >
              <Tab label="Semua" value="all" sx={{ minHeight: 36, fontSize: 12 }} />
              <Tab
                label="Belum dibaca"
                value="unread"
                sx={{ minHeight: 36, fontSize: 12 }}
              />
            </Tabs>
          </Box>

          <Divider />

          <List
            disablePadding
            sx={{
              maxHeight: isSmallScreen ? "55vh" : 420,
              overflowY: "auto",
            }}
          >
            {visibleNotifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Icon
                  icon="solar:bell-off-linear"
                  fontSize="34px"
                  color={theme.palette.text.secondary}
                />
                <Typography sx={{ mt: 1, fontWeight: 600 }}>
                  Belum ada notifikasi
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  Informasi approval dan pembayaran akan tampil di sini.
                </Typography>
              </Box>
            ) : (
              visibleNotifications.map((notification) => {
                const unread = !notification.read_at;
                return (
                  <ListItemButton
                    key={notification.recipient_id}
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      alignItems: "flex-start",
                      gap: 1.25,
                      px: 2,
                      py: 1.25,
                      bgcolor: unread
                        ? alpha(theme.palette.primary.main, 0.08)
                        : "transparent",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        mt: 0.8,
                        flex: "0 0 auto",
                        bgcolor: unread
                          ? theme.palette.primary.main
                          : "transparent",
                      }}
                    />
                    <ListItemText
                      disableTypography
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: unread ? 700 : 600,
                              flex: 1,
                              minWidth: 0,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {getNotificationTitle(notification)}
                          </Typography>
                          <Chip
                            label={notification.priority}
                            color={priorityColor[notification.priority] || "default"}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 10,
                              textTransform: "capitalize",
                            }}
                          />
                        </Stack>
                      }
                      secondary={
                        <NotificationMessage notification={notification} />
                      }
                    />
                    <Tooltip title="Bersihkan">
                      <IconButton
                        size="small"
                        onClick={(event) =>
                          handleArchiveNotification(event, notification.id)
                        }
                        disabled={notificationActionLoading}
                        sx={{ mt: -0.4, color: "text.secondary" }}
                      >
                        <Icon icon="line-md:close" fontSize="18px" />
                      </IconButton>
                    </Tooltip>
                  </ListItemButton>
                );
              })
            )}
          </List>

          <Divider />

          <Stack
            direction={isSmallScreen ? "column" : "row"}
            spacing={1}
            sx={{ p: 1.25 }}
          >
            <Button
              size="small"
              variant="outlined"
              fullWidth
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || notificationActionLoading}
              sx={{ textTransform: "none" }}
            >
              Tandai dibaca
            </Button>
            <Button
              size="small"
              variant="contained"
              fullWidth
              onClick={handleArchiveAll}
              disabled={notifications.length === 0 || notificationActionLoading}
              sx={{ textTransform: "none" }}
            >
              Bersihkan
            </Button>
          </Stack>
        </Popover>

        <Tooltip title="Settings">
          <IconButton
            onClick={handleAvatarClick}
            size="small"
            sx={{
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
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
            sx: { mt: 1.5, minWidth: 180 },
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
