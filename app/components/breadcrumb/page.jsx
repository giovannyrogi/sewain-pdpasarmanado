"use client";
import React from "react";
import {
  Breadcrumbs,
  Link,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

function findBreadcrumbFromMenu(menuList, pathname) {
  for (const menu of menuList) {
    if (menu.path) {
      if (pathname === menu.path || pathname.startsWith(menu.path + "/")) {
        return [
          {
            label: menu.label,
            value: menu.value,
            icon: menu.icon,
            path: menu.path,
          },
        ];
      }
    }

    if (menu.submenu) {
      for (const sub of menu.submenu) {
        if (
          pathname === sub.path ||
          pathname.startsWith(sub.path + "/")
        ) {
          return [
            {
              label: menu.label,
              value: menu.value,
              icon: menu.icon,
              path: menu.path || "#",
            },
            {
              label: sub.label,
              value: sub.value,
              icon: sub.icon,
              path: sub.path,
            },
          ];
        }
      }
    }
  }

  return [
    {
      label: "Dashboard",
      value: "dashboard",
      path: "/dashboard",
    },
  ];
}

const renderBreadcrumbIcon = (icon) => {
  if (!icon) return null;
  return typeof icon === "string" ? <Icon icon={icon} fontSize={16} /> : icon;
};

const BreadcrumbPage = ({ menuList = [], items, variant = "default" }) => {
  const theme = useTheme();
  const pathname = usePathname();

  const breadcrumbs = items?.length ? items : findBreadcrumbFromMenu(menuList, pathname);
  const isHeaderVariant = variant === "pageHeader";

  return (
    <Box
      sx={{
        p: isHeaderVariant ? 0 : "10px 15px",
        width: isHeaderVariant ? "fit-content" : "100%",
        maxWidth: "100%",
        bgcolor: isHeaderVariant ? "transparent" : "background.default",
        overflowX: "auto",
        mt: isHeaderVariant ? 0 : 1,
        mb: isHeaderVariant ? 0 : 2,
      }}
    >
      <Breadcrumbs
        separator={
          <NavigateNextIcon
            fontSize="small"
            sx={{
              color: isHeaderVariant ? theme.ui.mutedText : "inherit",
              fontSize: isHeaderVariant ? 16 : undefined,
            }}
          />
        }
        aria-label="breadcrumb"
        sx={{
          "& .MuiBreadcrumbs-ol": {
            flexWrap: "nowrap",
          },
        }}
      >
        {breadcrumbs.map((item, idx) =>
          idx < breadcrumbs.length - 1 ? (
            <Link
              key={item.value}
              underline="hover"
              color="inherit"
              href={item.path}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                fontFamily: "Poppins",
                fontSize: isHeaderVariant ? "12px" : "14px",
                fontWeight: isHeaderVariant ? 750 : 400,
                whiteSpace: "nowrap",
                color: isHeaderVariant ? theme.ui.mutedText : "inherit",
                "& svg": {
                  color: isHeaderVariant ? theme.ui.mutedText : "inherit",
                },
              }}
            >
              {renderBreadcrumbIcon(item.icon)}
              {item.label}
            </Link>
          ) : (
            <Typography
              key={item.value}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                color: theme.palette.primary.main,
                fontFamily: "Poppins",
                fontWeight: isHeaderVariant ? 850 : "bold",
                fontSize: isHeaderVariant ? "12px" : "14px",
                whiteSpace: "nowrap",
                px: isHeaderVariant ? 1.25 : 0,
                py: isHeaderVariant ? 0.55 : 0,
                borderRadius: isHeaderVariant ? 999 : 0,
                bgcolor: isHeaderVariant
                  ? theme.palette.mode === "dark"
                    ? "rgba(255, 152, 0, 0.13)"
                    : "rgba(230, 9, 9, 0.10)"
                  : "transparent",
                "& svg": {
                  color: theme.palette.primary.main,
                },
              }}
            >
              {renderBreadcrumbIcon(item.icon)}
              {item.label}
            </Typography>
          )
        )}
      </Breadcrumbs>
    </Box>
  );
};

export default BreadcrumbPage;
