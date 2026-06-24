"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Grid, Stack, Typography, useTheme } from "@mui/material";
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
import CrudConfirmModal from "@/app/components/crud/CrudConfirmModal";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import TenantIdentityPreviewModal from "@/app/components/modals/TenantIdentityPreviewModal";
import IdentityModuleBadges from "@/app/components/identity/IdentityModuleBadges";
import { useUser } from "@/app/utils/useUser";
import IdentityFormModal from "./IdentityFormModal";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const ACTION_COLUMN_WIDTH = 164;
const TABLE_SCROLL_WIDTH = 1700;
const ADMIN_IZIN_LAHAN_ROLE_ID = 9;

const normalizeText = (value) => String(value || "").toLowerCase();

const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

const STATUS_LABELS = {
  active: "Aktif",
  inactive: "Tidak Aktif",
  blacklisted: "Blacklist",
};

const STATUS_COLORS = {
  active: "green",
  inactive: "red",
  blacklisted: "gold",
};

/**
 * Filter table reusable untuk kolom Identity Lists.
 * Nilai kosong dibuang agar filter tidak berisi opsi yang tidak berguna.
 */
const createColumnFilters = (data, key) =>
  [...new Set(data.map((item) => item[key]).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map((value) => ({ text: value, value }));

const createExactFilter = (key) => (value, record) => record[key] === value;

const formatBirth = (record) => {
  if (!record?.birth_date) return record?.birth_place || "-";
  return `${record.birth_place || "-"}, ${moment(record.birth_date).format("DD MMMM YYYY")}`;
};

const formatDateTime = (value) =>
  value ? moment(value).format("DD MMM YYYY, HH:mm") : "-";

/**
 * Halaman master data identitas penyewa.
 * Pola UI mengikuti Locations/Floor, tetapi isi tabel dan modal disesuaikan
 * untuk data personal, status blacklist, alamat lengkap, dan foto KTP.
 */
export default function IdentityList() {
  const theme = useTheme();
  const { user } = useUser();
  const [identities, setIdentities] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedIdentity, setSelectedIdentity] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);
  const isLandPermitAdmin = Number(user?.role_id) === ADMIN_IZIN_LAHAN_ROLE_ID;
  const isSuperadmin = Number(user?.role_id) === 1;
  const canViewLandPermitFields = isLandPermitAdmin || isSuperadmin;
  const statusField = isLandPermitAdmin ? "land_permit_status" : "status";
  const statusNotesField = isLandPermitAdmin
    ? "land_permit_status_notes"
    : "notes";

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchIdentities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/identity-list");
      if (response.data?.success) {
        setIdentities(response.data.data || []);
      } else {
        showSnackbar(
          response.data?.message || "Gagal mengambil data identitas.",
          "error",
        );
      }
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi error saat mengambil data identitas.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  const filteredIdentities = useMemo(() => {
    const keyword = normalizeText(searchText);
    if (!keyword) return identities;

    return identities.filter((item) =>
      [
        item.full_name,
        item.nik,
        item.occupation,
        item.nationality,
        item.birth_place,
        item.phone,
        item[statusField],
        item[statusNotesField],
        item.street_address,
        item.kelurahan,
        item.district,
        item.city,
        item.province,
        item.is_room_rental_registered ? "sewa ruangan" : "",
        item.is_land_permit_registered ? "izin lahan" : "",
      ].some((value) => normalizeText(value).includes(keyword)),
    );
  }, [identities, searchText, statusField, statusNotesField]);

  const identityStats = useMemo(() => {
    const active = identities.filter(
      (item) => item[statusField] === "active",
    ).length;
    const inactive = identities.filter(
      (item) => item[statusField] === "inactive",
    ).length;
    const blacklisted = identities.filter(
      (item) => item[statusField] === "blacklisted",
    ).length;

    return [
      {
        label: "Total Identitas",
        value: identities.length,
        icon: "qlementine-icons:id-card-16",
        color: theme.palette.primary.main,
      },
      {
        label: isLandPermitAdmin ? "Aktif Izin Lahan" : "Aktif",
        value: active,
        icon: "solar:user-check-bold-duotone",
        color: theme.palette.success.main,
      },
      {
        label: isLandPermitAdmin ? "Nonaktif Izin Lahan" : "Tidak Aktif",
        value: inactive,
        icon: "solar:user-cross-bold-duotone",
        color: theme.palette.error.main,
      },
      {
        label: isLandPermitAdmin ? "Blacklist Izin Lahan" : "Blacklist",
        value: blacklisted,
        icon: "solar:shield-warning-bold-duotone",
        color: theme.palette.warning.main,
      },
    ];
  }, [identities, isLandPermitAdmin, statusField, theme]);

  const openCreateModal = () => {
    setSelectedIdentity(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setSelectedIdentity(record);
    setFormMode("edit");
    setFormOpen(true);
  };

  const openDeleteModal = (record) => {
    setSelectedIdentity(record);
    setDeleteOpen(true);
  };

  const openPreviewModal = (record) => {
    setSelectedIdentity(record);
    setPreviewOpen(true);
  };

  const closeFormModal = () => {
    if (loading) return;
    setFormOpen(false);
    setSelectedIdentity(null);
  };

  const handleSaveIdentity = async (payload) => {
    setLoading(true);
    try {
      const request =
        formMode === "edit" && selectedIdentity?.id
          ? axios.put("/api/identity-list/update-identity", payload)
          : axios.post("/api/identity-list", payload);

      const response = await request;

      if (response.data?.success) {
        showSnackbar(
          response.data.message || "Data identitas berhasil disimpan.",
        );
        setFormOpen(false);
        setSelectedIdentity(null);
        await fetchIdentities();
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal menyimpan data identitas.",
        "error",
      );
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi error saat menyimpan data identitas.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIdentity = async () => {
    if (!selectedIdentity?.id) return;

    setLoading(true);
    try {
      const response = await axios.delete(
        `/api/identity-list/${selectedIdentity.id}`,
      );

      if (response.data?.success) {
        showSnackbar(
          response.data.message || "Data identitas berhasil dihapus.",
        );
        setDeleteOpen(false);
        setSelectedIdentity(null);
        await fetchIdentities();
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal menghapus data identitas.",
        "error",
      );
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi error saat menghapus data identitas.",
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
        title: "Identitas",
        dataIndex: "full_name",
        width: 300,
        filters: createColumnFilters(identities, "full_name"),
        onFilter: createExactFilter("full_name"),
        filterSearch: true,
        sorter: (a, b) => a.full_name.localeCompare(b.full_name),
        render: (_, record) => (
          <Stack spacing={0.45}>
            <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
              {record.full_name || "-"}
            </Typography>
            <Typography
              sx={{
                color: theme.ui.mutedText,
                fontWeight: 700,
                fontSize: 11.5,
              }}
            >
              NIK {record.nik || "-"}
            </Typography>
            <IdentityModuleBadges identity={record} compact />
          </Stack>
        ),
      },
      {
        title: "Tempat, Tanggal Lahir",
        dataIndex: "birth_place",
        width: 240,
        render: (_, record) => (
          <Typography sx={{ fontWeight: 700, fontSize: 12 }}>
            {formatBirth(record)}
          </Typography>
        ),
      },
      {
        title: "Kontak & Pekerjaan",
        dataIndex: "occupation",
        width: 230,
        filters: createColumnFilters(identities, "occupation"),
        onFilter: createExactFilter("occupation"),
        filterSearch: true,
        render: (_, record) => (
          <Stack spacing={0.35}>
            <Typography sx={{ fontWeight: 850, fontSize: 12 }}>
              {record.occupation || "-"}
            </Typography>
            <Typography
              sx={{
                color: theme.ui.mutedText,
                fontWeight: 650,
                fontSize: 11.5,
              }}
            >
              {record.phone || "-"} | {record.nationality || "-"}
            </Typography>
          </Stack>
        ),
      },
      {
        title: "Alamat",
        dataIndex: "city",
        width: 300,
        render: (_, record) => (
          <Stack spacing={0.35}>
            <Typography sx={{ fontWeight: 800, fontSize: 12 }}>
              {record.street_address || "-"}
            </Typography>
            <Typography
              sx={{
                color: theme.ui.mutedText,
                fontWeight: 650,
                fontSize: 11.5,
              }}
            >
              {record.kelurahan || "-"}, {record.district || "-"},{" "}
              {record.city || "-"}
            </Typography>
          </Stack>
        ),
      },
      {
        title: "Status",
        dataIndex: statusField,
        width: 135,
        filters: [
          { text: "Aktif", value: "active" },
          { text: "Tidak Aktif", value: "inactive" },
          { text: "Blacklist", value: "blacklisted" },
        ],
        onFilter: createExactFilter(statusField),
        render: (value) => (
          <Tag
            color={STATUS_COLORS[value] || "default"}
            style={{
              borderRadius: 8,
              fontFamily: "Poppins",
              fontWeight: 850,
              padding: "3px 10px",
            }}
          >
            {STATUS_LABELS[value] || "-"}
          </Tag>
        ),
      },
      {
        title: "Diperbarui",
        dataIndex: "updated_at",
        width: 190,
        render: (value) => (
          <Typography sx={{ fontWeight: 650, fontSize: 12 }}>
            {formatDateTime(value)}
          </Typography>
        ),
      },
      {
        title: "Aksi",
        key: "action",
        width: ACTION_COLUMN_WIDTH,
        fixed: "right",
        align: "center",
        className: "identity-action-column",
        onHeaderCell: () => ({ className: "identity-action-column" }),
        onCell: () => ({ className: "identity-action-column" }),
        render: (_, record) => (
          <Box
            className="identity-action-buttons"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.85,
              width: "100%",
              minWidth: 118,
              flexWrap: "nowrap",
            }}
          >
            <TableActionButton
              title="Ubah identitas"
              color="info"
              icon="solar:pen-bold-duotone"
              onClick={() => openEditModal(record)}
            />
            <TableActionButton
              title="Lihat detail identitas"
              color="success"
              icon="solar:eye-bold-duotone"
              onClick={() => openPreviewModal(record)}
            />
            <TableActionButton
              title="Hapus identitas"
              color="error"
              icon="solar:trash-bin-trash-bold-duotone"
              onClick={() => openDeleteModal(record)}
            />
          </Box>
        ),
      },
    ],
    [identities, isLandPermitAdmin, statusField, theme],
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
          eyebrow="Data Master"
          breadcrumbs={[
            {
              label: "Data Master",
              value: "data-master",
              icon: "solar:database-bold-duotone",
              path: "#",
            },
            {
              label: "Identity Lists",
              value: "identity-lists",
              icon: "qlementine-icons:id-card-16",
              path: "/identity-lists",
            },
          ]}
          title="Identity Lists"
          description={
            isLandPermitAdmin
              ? "Kelola identitas bersama, status izin lahan, foto KTP, dan pas foto untuk kebutuhan pendaftaran izin lahan."
              : "Kelola data identitas penyewa, NIK, alamat, status blacklist, dan dokumen KTP yang dipakai pada proses permohonan sewa."
          }
          icon="qlementine-icons:id-card-16"
          actionSx={{
            width: { xs: "100%", md: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", md: "flex-end" },
          }}
          action={
            <Button
              fullWidth
              variant="contained"
              startIcon={<Icon icon="solar:user-plus-bold-duotone" />}
              onClick={openCreateModal}
              sx={{
                minHeight: 46,
                px: { xs: 2, sm: 2.5 },
                borderRadius: 2,
                fontFamily: "Poppins",
                fontWeight: 900,
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
              Tambah Identitas
            </Button>
          }
        />

        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
          {identityStats.map((item) => (
            <Grid key={item.label} size={{ xs: 6, md: 3 }}>
              <SummaryStatCard {...item} />
            </Grid>
          ))}
        </Grid>

        <DataTableShell
          title="Daftar Identitas"
          description={`${filteredIdentities.length} dari ${identities.length} identitas ditampilkan`}
          searchValue={searchText}
          searchPlaceholder="Cari nama, NIK, pekerjaan, alamat, atau status..."
          onSearchChange={setSearchText}
        >
          <ReusableAntTable
            columns={columns}
            dataSource={filteredIdentities}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            tableLayout="fixed"
            scroll={{ x: TABLE_SCROLL_WIDTH, y: 430 }}
            onPageSizeChange={setPageSize}
            fixedActionColumn={{
              className: "identity-action-column",
              buttonsClassName: "identity-action-buttons",
              buttonsOffsetX: 6,
              width: ACTION_COLUMN_WIDTH,
              paddingX: 16,
            }}
          />
        </DataTableShell>
      </Stack>

      <IdentityFormModal
        open={formOpen}
        mode={formMode}
        initialData={selectedIdentity}
        isLandPermitContext={isLandPermitAdmin}
        userRoleId={user?.role_id}
        loading={loading}
        onClose={closeFormModal}
        onSubmit={handleSaveIdentity}
        onNotify={setSnackbar}
      />

      <CrudConfirmModal
        open={deleteOpen}
        title="Hapus Identitas"
        description="Data identitas yang dihapus tidak dapat digunakan lagi pada transaksi baru. Anda yakin ingin menghapus"
        titleDescription="Form untuk menghapus data identitas."
        highlight={selectedIdentity?.full_name}
        confirmLabel="Hapus Identitas"
        loadingLabel="Menghapus..."
        loading={loading}
        onClose={() => !loading && setDeleteOpen(false)}
        onConfirm={handleDeleteIdentity}
      />

      <TenantIdentityPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        selectedData={selectedIdentity}
        showLandPermitFields={canViewLandPermitFields}
      />

      <LoadingBackdrop
        message="Loading..."
        open={loading && !formOpen && !deleteOpen}
      />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />
    </Box>
  );
}
