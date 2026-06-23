"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Grid, Stack, TextField, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Tag } from "antd";
import { Icon } from "@iconify/react";
import axios from "axios";
import moment from "moment";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import TableActionButton from "@/app/components/data-table/TableActionButton";
import CrudFormModal from "@/app/components/crud/CrudFormModal";
import CrudConfirmModal from "@/app/components/crud/CrudConfirmModal";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const CORE_ROLE_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8]);
const APPROVAL_ROLE_IDS = new Set([3, 4, 5, 6, 7]);
const MAX_ROLE_NAME_LENGTH = 50;

const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

const normalizeText = (value) => String(value || "").toLowerCase();

const normalizeRoleName = (value) => String(value || "").trim().replace(/\s+/g, " ");

const formatDateTime = (value) =>
  value ? moment(value).format("DD MMM YYYY, HH:mm") : "-";

const createColumnFilters = (data, key) =>
  [...new Set(data.map((item) => item[key]).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map((value) => ({ text: value, value }));

const createExactFilter = (key) => (value, record) => record[key] === value;

const getRoleCategory = (roleId) => {
  if (roleId === 1) return { label: "Superadmin", color: "red" };
  if (roleId === 2) return { label: "Admin Kontrak", color: "orange" };
  if (APPROVAL_ROLE_IDS.has(roleId)) return { label: "Approval", color: "gold" };
  if (roleId === 8) return { label: "Keuangan", color: "green" };
  return { label: "Tambahan", color: "blue" };
};

const getRoleCategoryLabel = (roleId) => getRoleCategory(Number(roleId)).label;

const validateRoleName = (value) => {
  const roleName = normalizeRoleName(value);

  if (!roleName) {
    return "Nama peran wajib diisi.";
  }

  if (roleName.length > MAX_ROLE_NAME_LENGTH) {
    return `Nama peran maksimal ${MAX_ROLE_NAME_LENGTH} karakter.`;
  }

  return "";
};

/**
 * Halaman master data Peran.
 * Role inti sistem tetap bisa diganti namanya, tetapi tidak bisa dihapus karena
 * ID role dipakai sebagai pengikat flow menu, approval, pembayaran, dan notifikasi.
 */
export default function Roles() {
  const theme = useTheme();
  const [roles, setRoles] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleName, setRoleName] = useState("");
  const [roleNameError, setRoleNameError] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/roles");
      if (response.data?.success) {
        setRoles(response.data.data || []);
        return;
      }

      showSnackbar(response.data?.message || "Gagal mengambil data peran.", "error");
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi error saat mengambil data peran.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const rolesWithCategory = useMemo(
    () =>
      roles.map((role) => ({
        ...role,
        category: getRoleCategoryLabel(Number(role.id)),
      })),
    [roles],
  );

  const filteredRoles = useMemo(() => {
    const keyword = normalizeText(searchText);
    if (!keyword) return rolesWithCategory;

    return rolesWithCategory.filter((item) =>
      [item.role_name, item.category, item.created_at, item.updated_at].some((value) =>
        normalizeText(value).includes(keyword),
      ),
    );
  }, [rolesWithCategory, searchText]);

  const roleStats = useMemo(() => {
    const coreCount = roles.filter((item) => CORE_ROLE_IDS.has(Number(item.id))).length;
    const approvalCount = roles.filter((item) =>
      APPROVAL_ROLE_IDS.has(Number(item.id)),
    ).length;
    const customCount = Math.max(roles.length - coreCount, 0);

    return [
      {
        label: "Total Peran",
        value: roles.length,
        icon: "oui:app-users-roles",
        color: theme.palette.primary.main,
      },
      {
        label: "Peran Inti",
        value: coreCount,
        icon: "solar:shield-keyhole-bold-duotone",
        color: theme.palette.info.main,
      },
      {
        label: "Role Approval",
        value: approvalCount,
        icon: "solar:checklist-minimalistic-bold-duotone",
        color: theme.palette.success.main,
      },
      {
        label: "Peran Tambahan",
        value: customCount,
        icon: "solar:user-plus-rounded-bold-duotone",
        color: theme.palette.warning.main,
      },
    ];
  }, [roles, theme]);

  const openCreateModal = () => {
    setSelectedRole(null);
    setRoleName("");
    setRoleNameError("");
    setFormMode("create");
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setSelectedRole(record);
    setRoleName(record?.role_name || "");
    setRoleNameError("");
    setFormMode("edit");
    setFormOpen(true);
  };

  const openDeleteModal = (record) => {
    setSelectedRole(record);
    setDeleteOpen(true);
  };

  const closeFormModal = () => {
    if (loading) return;
    setFormOpen(false);
    setSelectedRole(null);
    setRoleName("");
    setRoleNameError("");
  };

  const handleRoleNameChange = (event) => {
    const nextValue = event.target.value;
    setRoleName(nextValue);
    if (roleNameError) {
      setRoleNameError(validateRoleName(nextValue));
    }
  };

  const handleSaveRole = async (event) => {
    event.preventDefault();

    const validationMessage = validateRoleName(roleName);
    if (validationMessage) {
      setRoleNameError(validationMessage);
      return;
    }

    const payload = { roleName: normalizeRoleName(roleName) };

    setLoading(true);
    try {
      const request =
        formMode === "edit" && selectedRole?.id
          ? axios.put(`/api/roles/${selectedRole.id}`, payload)
          : axios.post("/api/roles", payload);

      const response = await request;

      if (response.data?.success) {
        showSnackbar(response.data.message || "Peran berhasil disimpan.");
        setFormOpen(false);
        setSelectedRole(null);
        setRoleName("");
        setRoleNameError("");
        await fetchRoles();
        return;
      }

      showSnackbar(response.data?.message || "Gagal menyimpan peran.", "error");
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi error saat menyimpan peran.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole?.id) return;

    setLoading(true);
    try {
      const response = await axios.delete(`/api/roles/${selectedRole.id}`);

      if (response.data?.success) {
        showSnackbar(response.data.message || "Peran berhasil dihapus.");
        setDeleteOpen(false);
        setSelectedRole(null);
        await fetchRoles();
        return;
      }

      showSnackbar(response.data?.message || "Gagal menghapus peran.", "error");
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi error saat menghapus peran.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "No",
        width: 72,
        align: "center",
        render: (_, __, index) => index + 1,
      },
      {
        title: "Peran",
        dataIndex: "role_name",
        width: 340,
        filters: createColumnFilters(rolesWithCategory, "role_name"),
        onFilter: createExactFilter("role_name"),
        filterSearch: true,
        sorter: (a, b) => String(a.role_name).localeCompare(String(b.role_name)),
        render: (_, record) => {
          const isCoreRole = CORE_ROLE_IDS.has(Number(record.id));

          return (
            <Stack spacing={0.75}>
              <Typography sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                {record.role_name || "-"}
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  label={`ID ${record.id}`}
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
                {isCoreRole && (
                  <Chip
                    size="small"
                    label="Role inti"
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
                )}
              </Stack>
            </Stack>
          );
        },
      },
      {
        title: "Kategori",
        dataIndex: "category",
        width: 190,
        filters: createColumnFilters(rolesWithCategory, "category"),
        onFilter: createExactFilter("category"),
        sorter: (a, b) => String(a.category).localeCompare(String(b.category)),
        render: (_, record) => {
          const category = getRoleCategory(Number(record.id));

          return (
            <Tag
              color={category.color}
              style={{
                borderRadius: 999,
                fontFamily: "Poppins",
                fontWeight: 800,
                padding: "4px 10px",
              }}
            >
              {category.label}
            </Tag>
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
        className: "roles-action-column",
        render: (_, record) => {
          const isCoreRole = CORE_ROLE_IDS.has(Number(record.id));

          return (
            <Stack
              className="roles-action-buttons"
              direction="row"
              spacing={0.75}
              justifyContent="center"
            >
              <TableActionButton
                title="Ubah peran"
                color="info"
                icon="solar:pen-bold-duotone"
                onClick={() => openEditModal(record)}
              />
              <TableActionButton
                title={
                  isCoreRole
                    ? "Role inti sistem tidak dapat dihapus"
                    : "Hapus peran"
                }
                color="error"
                icon="solar:trash-bin-trash-bold-duotone"
                disabled={isCoreRole}
                onClick={() => openDeleteModal(record)}
              />
            </Stack>
          );
        },
      },
    ],
    [rolesWithCategory, theme],
  );

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "calc(100vh - 64px)",
        bgcolor: theme.ui.pageBg,
        p: { xs: 1.25, sm: 2, lg: 2.25 },
        transition: "background-color 0.2s ease",
      }}
    >
      <Stack spacing={{ xs: 1.5, lg: 2 }}>
        <PageHeader
          breadcrumbs={[
            {
              label: "Data Master",
              value: "data-master",
              icon: "solar:database-bold-duotone",
              path: "#",
            },
            {
              label: "Peran",
              value: "roles",
              icon: "oui:app-users-roles",
              path: "/roles",
            },
          ]}
          title="Peran"
          description="Kelola daftar peran pengguna yang mengatur akses menu, approval, pembayaran, dan administrasi sistem."
          icon="oui:app-users-roles"
          actionSx={{
            width: { xs: "100%", md: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", md: "flex-end" },
          }}
          action={
            <Button
              fullWidth
              variant="contained"
              startIcon={<Icon icon="oui:app-users-roles" />}
              onClick={openCreateModal}
              sx={{
                minHeight: 46,
                px: { xs: 2, sm: 2.5 },
                borderRadius: 2,
                fontFamily: "Poppins",
                fontWeight: 700,
                textTransform: "none",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 6px 14px rgba(255, 152, 0, 0.18)"
                    : "0 6px 14px rgba(230, 9, 9, 0.16)",
                "&:hover": {
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 8px 18px rgba(255, 152, 0, 0.22)"
                      : "0 8px 18px rgba(230, 9, 9, 0.20)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Tambah Peran
            </Button>
          }
        />

        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
          {roleStats.map((item) => (
            <Grid key={item.label} size={{ xs: 6, md: 3 }}>
              <SummaryStatCard {...item} />
            </Grid>
          ))}
        </Grid>

        <DataTableShell
          title="Daftar Peran"
          description={`${filteredRoles.length} dari ${roles.length} peran ditampilkan`}
          searchValue={searchText}
          searchPlaceholder="Cari peran, kategori, atau tanggal..."
          onSearchChange={setSearchText}
        >
          <ReusableAntTable
            columns={columns}
            dataSource={filteredRoles}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            scroll={{ x: 1120, y: 430 }}
            onPageSizeChange={setPageSize}
            fixedActionColumn={{
              className: "roles-action-column",
              buttonsClassName: "roles-action-buttons",
              width: 116,
              paddingX: 12,
            }}
          />
        </DataTableShell>
      </Stack>

      <CrudFormModal
        open={formOpen}
        title={formMode === "edit" ? "Ubah Peran" : "Tambah Peran"}
        description="Lengkapi nama peran yang akan digunakan untuk mengelola akses pengguna."
        icon="oui:app-users-roles"
        submitLabel={formMode === "edit" ? "Simpan Perubahan" : "Tambah Peran"}
        loadingLabel={formMode === "edit" ? "Menyimpan perubahan..." : "Menambah peran..."}
        loading={loading}
        width={520}
        onClose={closeFormModal}
        onSubmit={handleSaveRole}
      >
        <TextField
          fullWidth
          label="Nama Peran *"
          value={roleName}
          onChange={handleRoleNameChange}
          error={Boolean(roleNameError)}
          helperText={roleNameError || `${normalizeRoleName(roleName).length}/${MAX_ROLE_NAME_LENGTH} karakter`}
          autoFocus
          disabled={loading}
          inputProps={{ maxLength: MAX_ROLE_NAME_LENGTH }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              fontFamily: "Poppins",
            },
            "& .MuiFormHelperText-root": {
              fontFamily: "Poppins",
              fontWeight: 600,
            },
          }}
        />
      </CrudFormModal>

      <CrudConfirmModal
        open={deleteOpen}
        title="Hapus Peran"
        titleDescription="Peran ini tidak dapat digunakan lagi setelah dihapus."
        description="Anda yakin ingin menghapus peran"
        highlight={selectedRole?.role_name || "-"}
        confirmLabel="Hapus Peran"
        loadingLabel="Menghapus peran..."
        loading={loading}
        onClose={() => !loading && setDeleteOpen(false)}
        onConfirm={handleDeleteRole}
      />

      <LoadingBackdrop message="Loading..." open={loading && !formOpen && !deleteOpen} />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />
    </Box>
  );
}
