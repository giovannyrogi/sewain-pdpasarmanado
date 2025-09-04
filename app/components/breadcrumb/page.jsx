"use client";
import React from "react";
import { Breadcrumbs, Link, Typography, Paper, useTheme } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { usePathname } from "next/navigation";
import { useThemeMode } from "../themeprovider/ThemeContext";

/**
 * Helper untuk mencari urutan breadcrumbs berdasarkan path URL
 * @param {Array} menuList - Daftar menu (dengan submenu)
 * @param {string[]} pathParts - Array bagian path, misal: ["datamaster", "locations"]
 * @returns {Array} - Array urutan breadcrumbs
 */
function findMenuPath(menuList, pathParts) {
  // Cek dari depan ke belakang, cari menu dan submenu yang match
  for (const menu of menuList) {
    // Cek submenu
    if (menu.submenu) {
      for (const sub of menu.submenu) {
        // Jika path submenu match
        if (
          sub.path &&
          pathParts
            .join("/")
            .endsWith(sub.path.replace(/^\/(admin|cashier|superadmin)\//, ""))
        ) {
          return [
            {
              label: menu.label,
              value: menu.value,
              icon: menu.icon,
              path: menu.path,
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
    // Jika path menu utama match
    if (
      menu.path &&
      pathParts
        .join("/")
        .endsWith(menu.path.replace(/^\/(admin|cashier|superadmin)\//, ""))
    ) {
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
  // Default: Dashboard
  return [
    menuList.find((m) => m.value === "dashboard") || {
      label: "Dashboard",
      value: "dashboard",
      path: "/admin/dashboard",
    },
  ];
}

const BreadcrumbPage = ({ menuList }) => {
 const { themeMode, setThemeMode } = useThemeMode();
   const theme = useTheme();
  // Ambil path saat ini, misal: /admin/datamaster/locations
  const pathname = usePathname();
  // Slice 1 untuk menghilangkan slash awal contoh : "/admin/datamaster/locations" jadi "/datamaster/locations"
  const pathParts = pathname.split("/").filter(Boolean).slice(1);

  const breadcrumbs = findMenuPath(menuList, pathParts);

  return (
    <Paper
      elevation={6}
      sx={{
        p: "10px 15px 10px 15px",
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
              href={item.path || "#"}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              {item.icon}
              {item.label}
            </Link>
          ) : (
            <Typography
              key={item.value}
              color="text.primary"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: theme.palette.primary.main,
                fontWeight: "bold",
              }}
            >
              {item.icon}
              {item.label}
            </Typography>
          )
        )}
      </Breadcrumbs>
    </Paper>
  );
};

export default BreadcrumbPage;
