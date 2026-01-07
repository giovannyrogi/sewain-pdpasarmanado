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

const BreadcrumbPage = ({ menuList = [] }) => {
  const theme = useTheme();
  const pathname = usePathname();

  const breadcrumbs = findBreadcrumbFromMenu(menuList, pathname);

  return (
    <Box
      sx={{
        p: "10px 15px",
        width: "100%",
        bgcolor: "background.default",
        overflowX: "auto",
        mt: 1,
        mb: 2,
      }}
    >
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
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
                gap: 1,
                fontSize: "14px",
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          ) : (
            <Typography
              key={item.value}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: theme.palette.primary.main,
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              {item.icon}
              {item.label}
            </Typography>
          )
        )}
      </Breadcrumbs>
    </Box>
  );
};

export default BreadcrumbPage;
