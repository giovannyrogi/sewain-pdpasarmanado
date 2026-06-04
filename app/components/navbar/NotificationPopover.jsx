import React from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import NotificationMessage, {
  getNotificationTitle,
} from "../notifications/NotificationMessage";
import { priorityColor } from "./TopMenu.helpers";

/**
 * Notification dropdown content.
 * The data mutations still live in TopMenu, while this component owns only the
 * responsive presentation of tabs, list rows, and bulk action buttons.
 */
export default function NotificationPopover({
  anchorEl,
  open,
  onClose,
  isSmallScreen,
  notifications,
  visibleNotifications,
  unreadCount,
  notificationLoading,
  notificationActionLoading,
  notificationTab,
  onTabChange,
  onNotificationClick,
  onArchiveNotification,
  onMarkAllRead,
  onArchiveAll,
}) {
  const theme = useTheme();

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        sx: {
          mt: 1.5,
          width: isSmallScreen ? "calc(100vw - 24px)" : 390,
          maxWidth: "calc(100vw - 24px)",
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: theme.ui.menuPaperBg,
          color: "text.primary",
          border: `1px solid ${theme.ui.navBorder}`,
          boxShadow: theme.ui.shellShadow,
          backdropFilter: "blur(18px)",
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
          onChange={onTabChange}
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
                onClick={() => onNotificationClick(notification)}
                sx={{
                  alignItems: "flex-start",
                  gap: 1.25,
                  px: 2,
                  py: 1.25,
                  bgcolor: unread ? theme.ui.navItemActive : "transparent",
                  "&:hover": {
                    bgcolor: theme.ui.navItemHover,
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
                    bgcolor: unread ? theme.palette.primary.main : "transparent",
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
                  secondary={<NotificationMessage notification={notification} />}
                />
                <Tooltip title="Bersihkan">
                  <IconButton
                    size="small"
                    onClick={(event) =>
                      onArchiveNotification(event, notification.id)
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

      <Stack direction={isSmallScreen ? "column" : "row"} spacing={1} sx={{ p: 1.25 }}>
        <Button
          size="small"
          variant="outlined"
          fullWidth
          onClick={onMarkAllRead}
          disabled={unreadCount === 0 || notificationActionLoading}
          sx={{ textTransform: "none" }}
        >
          Tandai dibaca
        </Button>
        <Button
          size="small"
          variant="contained"
          fullWidth
          onClick={onArchiveAll}
          disabled={notifications.length === 0 || notificationActionLoading}
          sx={{ textTransform: "none" }}
        >
          Bersihkan
        </Button>
      </Stack>
    </Popover>
  );
}
