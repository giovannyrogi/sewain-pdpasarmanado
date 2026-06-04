import { useCallback, useState } from "react";
import { Paper, useTheme } from "@mui/material";
import { useThemeMode } from "../themeprovider/ThemeContext";
import { usePathname, useRouter } from "next/navigation";
import SidebarContent from "./SidebarContent";

const getLogoSrc = (themeMode) =>
  themeMode === "dark" ? "/logo-darkmode.png" : "/logo-lightmode.png";

const LeftNavBar = ({
  menus,
  activeMenu,
  onMenuClick,
  user,
  onHideLoading,
  onShowLoading,
  setLoadingMessage,
}) => {
  const theme = useTheme();
  const { themeMode } = useThemeMode();
  const [openDropdown, setOpenDropdown] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Centralized menu navigation for desktop sidebar items.
   * Submenu parents only toggle their dropdown; leaf items trigger route changes
   * and preserve the app-level loading backdrop used across protected pages.
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
            onMenuClick?.(menu.value);
          }
        }, 100);
      } catch (err) {
        console.error("Navigation error:", err);
        onHideLoading?.();
      }
    },
    [onHideLoading, onMenuClick, onShowLoading, router, setLoadingMessage],
  );

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        height: "100%",
        minHeight: "100vh",
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        bgcolor: theme.ui.navBg,
        borderRadius: 0,
        borderRight: `1px solid ${theme.ui.navBorder}`,
        boxShadow: "none",
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
      />

    </Paper>
  );
};

export default LeftNavBar;
