"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, useMediaQuery, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import { useUser } from "@/app/utils/useUser";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import AddContract from "./AddContract";
import { generateContractDocument } from "./contractDocumentGenerator";
import {
  CONTRACTS_ACTION_COLUMN_WIDTH,
  CONTRACTS_PAGE_SIZE_OPTIONS,
  CONTRACTS_TABLE_SCROLL_WIDTH,
  buildContractStats,
  createContractColumns,
  filterContracts,
} from "./ContractsTableColumns";

const DEFAULT_LOADING_MESSAGE = "Loading...";

const PAGE_BREADCRUMBS = [
  {
    label: "Transactions",
    value: "transactions",
    path: "#",
    icon: "solar:money-bag-bold-duotone",
  },
  {
    label: "Contracts",
    value: "contracts",
    path: "/contracts",
    icon: "solar:document-text-bold-duotone",
  },
];

/**
 * Halaman Contracts menjadi pusat pembuatan dan download buku kontrak.
 * Page ini hanya mengatur fetch data, state modal, dan action dokumen; detail
 * table, statistik, serta generate DOCX dipisah agar mudah dirawat.
 */
export default function ContractsPage() {
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [contracts, setContracts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(DEFAULT_LOADING_MESSAGE);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const getDataContract = async ({ showLoading = true } = {}) => {
    if (!user) return;

    if (showLoading) {
      setLoadingMessage("Mengambil data kontrak...");
      setLoading(true);
    }

    try {
      const response = await axios.get("/api/contracts");

      if (response.data?.success) {
        setContracts(response.data.data || []);
        return;
      }

      showSnackbar(response.data?.message || "Gagal mengambil data kontrak.", "error");
    } catch (error) {
      console.error("Error fetch contracts:", error);
      showSnackbar(
        error?.response?.data?.message || "Gagal mengambil data kontrak.",
        "error",
      );
    } finally {
      if (showLoading) {
        setLoading(false);
        setLoadingMessage(DEFAULT_LOADING_MESSAGE);
      }
    }
  };

  useEffect(() => {
    if (user) {
      getDataContract();
    }
  }, [user]);

  const handleDownloadContract = async (record) => {
    setLoadingMessage("Membuat dokumen kontrak...");
    setLoading(true);

    try {
      await generateContractDocument(record);
      showSnackbar("Dokumen kontrak berhasil dibuat.", "success");
    } catch (error) {
      console.error("Error generate contract document:", error);
      showSnackbar("Gagal membuat dokumen kontrak.", "error");
    } finally {
      setLoading(false);
      setLoadingMessage(DEFAULT_LOADING_MESSAGE);
    }
  };

  const filteredData = useMemo(
    () => filterContracts(contracts, searchText),
    [contracts, searchText],
  );

  const stats = useMemo(
    () => buildContractStats(contracts, theme),
    [contracts, theme],
  );

  const columns = useMemo(
    () =>
      createContractColumns({
        data: contracts,
        theme,
        isMobile,
        onDownload: handleDownloadContract,
      }),
    [contracts, theme, isMobile],
  );

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100%",
        p: { xs: 1.5, sm: 2 },
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <PageHeader
        breadcrumbs={PAGE_BREADCRUMBS}
        title="Contracts"
        description="Buat buku kontrak untuk tenant yang sudah lunas, pantau daftar kontrak aktif, dan unduh dokumen kontrak otomatis."
        icon="solar:document-text-bold-duotone"
        actionSx={{
          width: { xs: "100%", md: "auto" },
          display: "flex",
          justifyContent: { xs: "stretch", md: "flex-end" },
        }}
        action={
          <Button
            fullWidth
            variant="contained"
            startIcon={<Icon icon="solar:document-add-bold-duotone" />}
            onClick={() => setOpenAddModal(true)}
            sx={{
              minHeight: 46,
              px: { xs: 2, sm: 2.5 },
              borderRadius: 2,
              fontFamily: "Poppins",
              fontWeight: 900,
              textTransform: "none",
              boxShadow: theme.ui.buttonShadow,
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: theme.ui.buttonHoverShadow,
              },
            }}
          >
            Buat Kontrak
          </Button>
        }
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: { xs: 1.5, sm: 2 },
          alignItems: "stretch",
          width: "100%",
        }}
      >
        {stats.map((item) => (
          <Box key={item.label} sx={{ minWidth: 0 }}>
            <SummaryStatCard {...item} />
          </Box>
        ))}
      </Box>

      <DataTableShell
        title="Daftar Kontrak"
        description={`${filteredData.length} dari ${contracts.length} kontrak ditampilkan`}
        searchValue={searchText}
        searchPlaceholder="Cari penyewa, NIK, nomor kontrak, lokasi, ruangan"
        onSearchChange={setSearchText}
      >
        <ReusableAntTable
          rowKey={(record) => record?.contracts?.id || record?.tenant_application?.id}
          columns={columns}
          dataSource={filteredData}
          pageSize={pageSize}
          pageSizeOptions={CONTRACTS_PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
          scroll={{ x: CONTRACTS_TABLE_SCROLL_WIDTH, y: 430 }}
          fixedActionColumn={{
            className: "contracts-action-column",
            buttonsClassName: "contracts-action-buttons",
            width: CONTRACTS_ACTION_COLUMN_WIDTH,
            paddingX: 12,
          }}
        />
      </DataTableShell>

      <AddContract
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        getDataContract={() => getDataContract({ showLoading: false })}
        loading={loading}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        setLoadingMessage={setLoadingMessage}
        onNotify={(notify) => setSnackbar(notify)}
      />

      <LoadingBackdrop message={loadingMessage} open={loading} />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />
    </Box>
  );
}
