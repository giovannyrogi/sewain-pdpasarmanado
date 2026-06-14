"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Grid, Stack, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import CrudConfirmModal from "@/app/components/crud/CrudConfirmModal";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import { useUser } from "@/app/utils/useUser";
import UserFormModal from "./UserFormModal";
import { createUsersTableColumns } from "./UsersTableColumns";
import {
  APPROVAL_ROLE_IDS,
  PAGE_SIZE_OPTIONS,
  SUPERADMIN_ROLE_ID,
  getInitialForm,
  getInitialSnackbar,
  getRoleCategory,
  normalizeEmail,
  normalizeFullName,
  normalizeSearch,
  normalizeUsername,
  validateForm,
} from "./userUtils";

/**
 * Halaman master data Pengguna.
 * Page ini hanya mengatur state, fetch, dan orchestration; form serta kolom
 * tabel dipisahkan agar perubahan UI berikutnya tidak menumpuk di satu file.
 */
export default function Users() {
  const theme = useTheme();
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(getInitialForm);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/users");
      if (response.data?.success) {
        setUsers(response.data.data || []);
        return;
      }

      showSnackbar(response.data?.message || "Gagal mengambil data pengguna.", "error");
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi error saat mengambil data pengguna.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await axios.get("/api/roles");
      if (response.data?.success) {
        setRoles(response.data.data || []);
      }
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi error saat mengambil data peran.",
        "error",
      );
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const usersWithCategory = useMemo(
    () =>
      users.map((item) => ({
        ...item,
        role_category: getRoleCategory(item.role_id).label,
      })),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const keyword = normalizeSearch(searchText);
    if (!keyword) return usersWithCategory;

    return usersWithCategory.filter((item) =>
      [
        item.full_name,
        item.username,
        item.email,
        item.role_name,
        item.role_category,
        item.created_at,
        item.updated_at,
      ].some((value) => normalizeSearch(value).includes(keyword)),
    );
  }, [searchText, usersWithCategory]);

  const userStats = useMemo(() => {
    const superadminCount = users.filter(
      (item) => Number(item.role_id) === SUPERADMIN_ROLE_ID,
    ).length;
    const approvalCount = users.filter((item) =>
      APPROVAL_ROLE_IDS.has(Number(item.role_id)),
    ).length;
    const financeCount = users.filter((item) => Number(item.role_id) === 8).length;

    return [
      {
        label: "Total Pengguna",
        value: users.length,
        icon: "solar:users-group-rounded-bold-duotone",
        color: theme.palette.primary.main,
      },
      {
        label: "Superadmin",
        value: superadminCount,
        icon: "solar:shield-keyhole-bold-duotone",
        color: theme.palette.error.main,
      },
      {
        label: "Role Approval",
        value: approvalCount,
        icon: "solar:checklist-minimalistic-bold-duotone",
        color: theme.palette.success.main,
      },
      {
        label: "Keuangan",
        value: financeCount,
        icon: "solar:wallet-money-bold-duotone",
        color: theme.palette.info.main,
      },
    ];
  }, [users, theme]);

  const openCreateModal = () => {
    setSelectedUser(null);
    setForm(getInitialForm());
    setFormErrors({});
    setShowPassword(false);
    setFormMode("create");
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setSelectedUser(record);
    setForm({
      fullName: record?.full_name || "",
      username: record?.username || "",
      password: "",
      email: record?.email || "",
      roleId: record?.role_id || "",
    });
    setFormErrors({});
    setShowPassword(false);
    setFormMode("edit");
    setFormOpen(true);
  };

  const openDeleteModal = (record) => {
    setSelectedUser(record);
    setDeleteOpen(true);
  };

  const closeFormModal = () => {
    if (loading) return;
    setFormOpen(false);
    setSelectedUser(null);
    setForm(getInitialForm());
    setFormErrors({});
    setShowPassword(false);
  };

  const updateForm = (field) => (event) => {
    const rawValue = event.target.value;
    const value = field === "username" ? rawValue.replace(/\s/g, "") : rawValue;
    const nextForm = { ...form, [field]: value };

    setForm(nextForm);

    if (formErrors[field]) {
      const nextErrors = validateForm(nextForm, formMode);
      setFormErrors((current) => ({ ...current, [field]: nextErrors[field] || "" }));
    }
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm(form, formMode);
    if (Object.values(validationErrors).some(Boolean)) {
      setFormErrors(validationErrors);
      return;
    }

    const payload = {
      fullName: normalizeFullName(form.fullName),
      username: normalizeUsername(form.username),
      email: normalizeEmail(form.email),
      roleId: Number(form.roleId),
    };

    if (formMode === "create" || form.password) {
      payload.password = form.password;
    }

    setLoading(true);
    try {
      const request =
        formMode === "edit" && selectedUser?.id
          ? axios.put(`/api/users/${selectedUser.id}`, payload)
          : axios.post("/api/users", payload);

      const response = await request;

      if (response.data?.success) {
        showSnackbar(response.data.message || "Pengguna berhasil disimpan.");
        setFormOpen(false);
        setSelectedUser(null);
        setForm(getInitialForm());
        setFormErrors({});
        await fetchUsers();
        return;
      }

      showSnackbar(response.data?.message || "Gagal menyimpan pengguna.", "error");
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi error saat menyimpan pengguna.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?.id) return;

    setLoading(true);
    try {
      const response = await axios.delete(`/api/users/${selectedUser.id}`);

      if (response.data?.success) {
        showSnackbar(response.data.message || "Pengguna berhasil dihapus.");
        setDeleteOpen(false);
        setSelectedUser(null);
        await fetchUsers();
        return;
      }

      showSnackbar(response.data?.message || "Gagal menghapus pengguna.", "error");
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi error saat menghapus pengguna.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () =>
      createUsersTableColumns({
        theme,
        users: usersWithCategory,
        currentUserId: user?.id,
        onEdit: openEditModal,
        onDelete: openDeleteModal,
      }),
    [theme, usersWithCategory, user?.id],
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
              label: "Pengguna",
              value: "users",
              icon: "solar:users-group-rounded-bold-duotone",
              path: "/users",
            },
          ]}
          title="Pengguna"
          description="Kelola akun pengguna, akses peran, dan data kontak yang dipakai untuk proses operasional SewaIN."
          icon="solar:users-group-rounded-bold-duotone"
          actionSx={{
            width: { xs: "100%", md: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", md: "flex-end" },
          }}
          action={
            <Button
              fullWidth
              variant="contained"
              startIcon={<Icon icon="solar:user-plus-rounded-bold-duotone" />}
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
              Tambah Pengguna
            </Button>
          }
        />

        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
          {userStats.map((item) => (
            <Grid key={item.label} size={{ xs: 6, md: 3 }}>
              <SummaryStatCard {...item} />
            </Grid>
          ))}
        </Grid>

        <DataTableShell
          title="Daftar Pengguna"
          description={`${filteredUsers.length} dari ${users.length} pengguna ditampilkan`}
          searchValue={searchText}
          searchPlaceholder="Cari pengguna, username, email, atau peran..."
          onSearchChange={setSearchText}
        >
          <ReusableAntTable
            columns={columns}
            dataSource={filteredUsers}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            scroll={{ x: 1320, y: 430 }}
            onPageSizeChange={setPageSize}
            fixedActionColumn={{
              className: "users-action-column",
              buttonsClassName: "users-action-buttons",
              width: 116,
              paddingX: 12,
            }}
          />
        </DataTableShell>
      </Stack>

      <UserFormModal
        open={formOpen}
        mode={formMode}
        form={form}
        errors={formErrors}
        roles={roles}
        loading={loading}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword((current) => !current)}
        onChange={updateForm}
        onClose={closeFormModal}
        onSubmit={handleSaveUser}
      />

      <CrudConfirmModal
        open={deleteOpen}
        title="Hapus Pengguna"
        description="Akun pengguna akan dihapus dari sistem."
        confirmDescription="Anda yakin ingin menghapus pengguna"
        highlight={selectedUser?.full_name || "-"}
        confirmLabel="Hapus Pengguna"
        loadingLabel="Menghapus pengguna..."
        loading={loading}
        onClose={() => !loading && setDeleteOpen(false)}
        onConfirm={handleDeleteUser}
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
