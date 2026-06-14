"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Tag } from "antd";
import { Icon } from "@iconify/react";
import TableActionButton from "@/app/components/data-table/TableActionButton";
import {
  createColumnFilters,
  createExactFilter,
  formatDateTime,
  getRoleCategory,
} from "./userUtils";

/**
 * Konfigurasi kolom dipisahkan dari page agar tabel pengguna mudah dirawat.
 * Fixed action column memakai class khusus yang dibaca ReusableAntTable untuk
 * menjaga background tetap solid di dark/light mode saat horizontal scroll.
 */
export function createUsersTableColumns({
  theme,
  users,
  currentUserId,
  onEdit,
  onDelete,
}) {
  return [
    {
      title: "No",
      width: 72,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Pengguna",
      dataIndex: "full_name",
      width: 340,
      filters: createColumnFilters(users, "full_name"),
      onFilter: createExactFilter("full_name"),
      filterSearch: true,
      sorter: (a, b) => String(a.full_name).localeCompare(String(b.full_name)),
      render: (_, record) => (
        <Stack spacing={0.75}>
          <Typography sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
            {record.full_name || "-"}
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={`@${record.username || "-"}`}
              sx={{
                width: "fit-content",
                height: 24,
                borderRadius: 1.5,
                fontFamily: "Poppins",
                fontWeight: 700,
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
              }}
            />
            <Chip
              size="small"
              label={`ID ${record.id}`}
              sx={{
                width: "fit-content",
                height: 24,
                borderRadius: 1.5,
                fontFamily: "Poppins",
                fontWeight: 700,
                color: theme.palette.info.main,
                bgcolor: alpha(theme.palette.info.main, 0.12),
              }}
            />
          </Stack>
        </Stack>
      ),
    },
    {
      title: "Kontak",
      dataIndex: "email",
      width: 260,
      sorter: (a, b) => String(a.email).localeCompare(String(b.email)),
      render: (value) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              color: theme.palette.info.main,
              bgcolor: alpha(theme.palette.info.main, 0.12),
            }}
          >
            <Icon icon="solar:letter-bold-duotone" fontSize={17} />
          </Box>
          <Typography
            sx={{
              fontFamily: "Poppins",
              fontWeight: 650,
              fontSize: 12,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {value || "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      title: "Peran",
      dataIndex: "role_name",
      width: 230,
      filters: createColumnFilters(users, "role_name"),
      onFilter: createExactFilter("role_name"),
      filterSearch: true,
      sorter: (a, b) => String(a.role_name).localeCompare(String(b.role_name)),
      render: (_, record) => {
        const category = getRoleCategory(record.role_id);

        return (
          <Stack spacing={0.75}>
            <Typography sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
              {record.role_name || "-"}
            </Typography>
            <Tag
              color={category.color}
              style={{
                width: "fit-content",
                borderRadius: 999,
                fontFamily: "Poppins",
                fontWeight: 700,
                padding: "3px 9px",
              }}
            >
              {category.label}
            </Tag>
          </Stack>
        );
      },
    },
    {
      title: "Diperbarui",
      dataIndex: "updated_at",
      width: 190,
      sorter: (a, b) => String(a.updated_at).localeCompare(String(b.updated_at)),
      render: (value) => (
        <Typography sx={{ fontFamily: "Poppins", fontWeight: 650, fontSize: 12 }}>
          {formatDateTime(value)}
        </Typography>
      ),
    },
    {
      title: "Dibuat",
      dataIndex: "created_at",
      width: 190,
      sorter: (a, b) => String(a.created_at).localeCompare(String(b.created_at)),
      render: (value) => (
        <Typography sx={{ fontFamily: "Poppins", fontWeight: 650, fontSize: 12 }}>
          {formatDateTime(value)}
        </Typography>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      width: 116,
      fixed: "right",
      align: "center",
      className: "users-action-column",
      render: (_, record) => {
        const isCurrentUser = Number(record.id) === Number(currentUserId);

        return (
          <Stack
            className="users-action-buttons"
            direction="row"
            spacing={0.75}
            justifyContent="center"
          >
            <TableActionButton
              title="Ubah pengguna"
              color="info"
              icon="solar:pen-bold-duotone"
              onClick={() => onEdit(record)}
            />
            <TableActionButton
              title={
                isCurrentUser
                  ? "Akun yang sedang login tidak dapat dihapus"
                  : "Hapus pengguna"
              }
              color="error"
              icon="solar:trash-bin-trash-bold-duotone"
              disabled={isCurrentUser}
              onClick={() => onDelete(record)}
            />
          </Stack>
        );
      },
    },
  ];
}
