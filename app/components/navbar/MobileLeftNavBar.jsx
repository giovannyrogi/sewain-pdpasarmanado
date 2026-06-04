import { useCallback, useState } from "react";
import { Box, Drawer, useTheme } from "@mui/material";
import { useThemeMode } from "../themeprovider/ThemeContext";
import { usePathname, useRouter } from "next/navigation";
import SidebarContent from "./SidebarContent";

const getLogoSrc = (themeMode) =>
  themeMode === "dark" ? "/logo-darkmode.png" : "/logo-lightmode.png";

const MobileLeftNavBar = ({
  menus,
  activeMenu,
  onMenuClick,
  user,
  drawerOpen,
  onCloseDrawer,
  onShowLoading,
  onHideLoading,
  setLoadingMessage,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { themeMode } = useThemeMode();
  const [openDropdown, setOpenDropdown] = useState(null);

  /**
   * Mobile navigation mirrors the desktop menu behavior, then closes the drawer
   * once the target route has mounted. This keeps the drawer from disappearing
   * too early on slower page transitions.
   */
  const handleMenuClick = useCallback(
    async (menu) => {
      setLoadingMessage("Navigating...");
      onShowLoading?.();

      try {
        const path = menu.path;

        if (!path && menu.submenu) {
          setOpenDropdown((prev) => (prev === menu.value ? null : menu.value));
          setTimeout(() => {
            onHideLoading?.();
          }, 300);
          return;
        }

        if (!path) {
          onHideLoading?.();
          return;
        }

        router.push(path);

        const checkRouteChange = setInterval(() => {
          if (window.location.pathname === path) {
            clearInterval(checkRouteChange);
            onHideLoading?.();
            onCloseDrawer();
            onMenuClick?.(menu.value);
          }
        }, 100);
      } catch (err) {
        console.error("Navigation error:", err);
        onHideLoading?.();
      }
    },
    [
      onCloseDrawer,
      onHideLoading,
      onMenuClick,
      onShowLoading,
      router,
      setLoadingMessage,
    ],
  );

  return (
    <Box>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={onCloseDrawer}
        PaperProps={{
          sx: {
            width: { xs: 300, sm: 328 },
            maxWidth: "88vw",
            p: 2,
            bgcolor: theme.ui.navBg,
            borderRight: `1px solid ${theme.ui.navBorder}`,
            boxShadow: theme.ui.shellShadow,
          },
        }}
      >
        <SidebarContent
          menus={menus}
          activeMenu={activeMenu}
          user={user}
          pathname={pathname}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          onMenuClick={handleMenuClick}
          logoSrc={getLogoSrc(themeMode)}
          compact
        />
      </Drawer>
    </Box>
  );
};

export default MobileLeftNavBar;
