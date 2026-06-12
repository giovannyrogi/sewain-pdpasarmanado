"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, useTheme } from "@mui/material";
import { ConfigProvider, Table, theme as antdTheme } from "antd";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

/**
 * Table Ant Design reusable untuk seluruh halaman data.
 * Komponen ini memusatkan theme AntD, pagination, scroll, dan styling fixed
 * column agar halaman hanya fokus pada columns, data, dan aksi bisnisnya.
 */
export default function ReusableAntTable({
  rowKey = "id",
  columns,
  dataSource,
  loading,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageSizeChange,
  scroll = { x: 1280, y: 430 },
  tableLayout,
  fixedActionColumn,
  pagination,
  onChange,
  sx,
  ...tableProps
}) {
  const muiTheme = useTheme();
  const { themeMode } = useThemeMode();
  const effectivePageSize = Number(
    pageSize || pagination?.pageSize || pagination?.defaultPageSize || 5,
  );
  const [internalCurrentPage, setInternalCurrentPage] = useState(
    Number(pagination?.current || pagination?.defaultCurrent || 1),
  );
  const currentPage = Number(pagination?.current || internalCurrentPage || 1);

  useEffect(() => {
    if (pagination?.current) {
      setInternalCurrentPage(Number(pagination.current));
    }
  }, [pagination?.current]);

  useEffect(() => {
    if (pagination === false || pagination?.current) return;

    const totalRows = Array.isArray(dataSource) ? dataSource.length : 0;
    const maxPage = Math.max(1, Math.ceil(totalRows / effectivePageSize));

    if (internalCurrentPage > maxPage) {
      setInternalCurrentPage(maxPage);
    }
  }, [dataSource, effectivePageSize, internalCurrentPage, pagination]);

  const columnsWithAutoNumber = useMemo(() => {
    const startIndex =
      pagination === false ? 0 : (currentPage - 1) * effectivePageSize;

    /**
     * Kolom "No" pada AntD hanya menerima index per halaman. Wrapper ini
     * mengubahnya menjadi nomor absolut agar semua table reusable konsisten:
     * halaman 2 dengan page size 5 dimulai dari 6, bukan kembali ke 1.
     */
    return (columns || []).map((column) => {
      const shouldAutoNumber =
        column?.autoNumber !== false &&
        (column?.title === "No" || column?.dataIndex === "index");

      if (!shouldAutoNumber) return column;

      return {
        ...column,
        render: (_value, _record, index) => startIndex + index + 1,
      };
    });
  }, [columns, currentPage, effectivePageSize, pagination]);

  const actionColumnSx = fixedActionColumn
    ? {
        "--reusable-action-bg":
          muiTheme.palette.mode === "dark" ? "#111111" : "#ffffff",
        "--reusable-action-header-bg":
          muiTheme.palette.mode === "dark" ? "#1c1c1c" : "#f8f9fb",
        "--reusable-action-hover-bg":
          muiTheme.palette.mode === "dark" ? "#2b2317" : "#fff6f6",
        /**
         * Fixed column Ant Design berada di layer sticky terpisah.
         * Background solid wajib dipasang supaya data kolom lain tidak
         * terlihat tembus saat user scroll horizontal atau hover baris.
         */
        [`& .${fixedActionColumn.className}`]: {
          width: `${fixedActionColumn.width}px !important`,
          minWidth: `${fixedActionColumn.width}px !important`,
          maxWidth: `${fixedActionColumn.width}px !important`,
          paddingLeft: `${fixedActionColumn.paddingX ?? 14}px !important`,
          paddingRight: `${fixedActionColumn.paddingX ?? 14}px !important`,
          boxSizing: "border-box !important",
          zIndex: "8 !important",
          background: "var(--reusable-action-bg) !important",
          backgroundColor: "var(--reusable-action-bg) !important",
          backgroundImage: "none !important",
          backgroundClip: "border-box !important",
          opacity: "1 !important",
        },
        [`& .ant-table-tbody > tr > td.${fixedActionColumn.className}`]: {
          textAlign: "center !important",
          verticalAlign: "middle !important",
        },
        ...(fixedActionColumn.buttonsClassName
          ? {
              [`& .${fixedActionColumn.buttonsClassName}`]: {
                marginInline: "auto",
                ...(fixedActionColumn.buttonsOffsetX
                  ? { transform: `translateX(${fixedActionColumn.buttonsOffsetX}px)` }
                  : {}),
              },
            }
          : {}),
        [`& .ant-table-thead .${fixedActionColumn.className}`]: {
          textAlign: "center !important",
          zIndex: "10 !important",
          background: "var(--reusable-action-header-bg) !important",
          backgroundColor: "var(--reusable-action-header-bg) !important",
        },
        [`& .ant-table-tbody > tr:hover > .${fixedActionColumn.className}`]: {
          background: "var(--reusable-action-hover-bg) !important",
          backgroundColor: "var(--reusable-action-hover-bg) !important",
        },
      }
    : {};

  const mergedPagination =
    pagination === false
      ? false
      : {
          current: currentPage,
          pageSize: effectivePageSize,
          showSizeChanger: true,
          pageSizeOptions,
          showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} data`,
          ...pagination,
        };

  const handleChange = (nextPagination, filters, sorter, extra) => {
    if (nextPagination?.current) {
      setInternalCurrentPage(nextPagination.current);
    }

    if (nextPagination?.pageSize && nextPagination.pageSize !== effectivePageSize) {
      onPageSizeChange?.(nextPagination.pageSize);
    }

    onChange?.(nextPagination, filters, sorter, extra);
  };

  return (
    <ConfigProvider
      theme={{
        algorithm:
          themeMode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: muiTheme.palette.primary.main,
          colorBgContainer: muiTheme.ui.dashboardCardBg,
          colorText: muiTheme.palette.text.primary,
          colorBorder: muiTheme.ui.dashboardCardBorder,
          fontFamily: "Poppins, sans-serif",
          borderRadius: 10,
        },
        components: {
          Table: {
            headerBg:
              muiTheme.palette.mode === "dark"
                ? "rgba(255,255,255,0.045)"
                : "rgba(17,24,39,0.035)",
            rowHoverBg:
              muiTheme.palette.mode === "dark"
                ? "rgba(255,152,0,0.08)"
                : "rgba(230,9,9,0.05)",
          },
        },
      }}
    >
      <Box sx={[actionColumnSx, sx]}>
        <Table
          rowKey={rowKey}
          columns={columnsWithAutoNumber}
          dataSource={dataSource}
          loading={loading}
          tableLayout={tableLayout}
          showSorterTooltip={{ target: "sorter-icon" }}
          scroll={scroll}
          pagination={mergedPagination}
          onChange={handleChange}
          {...tableProps}
        />
      </Box>
    </ConfigProvider>
  );
}
