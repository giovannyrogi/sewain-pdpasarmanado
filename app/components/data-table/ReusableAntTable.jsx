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
  summaryRow,
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
        render: (_value, record, index) =>
          record?.__isTotal ? "" : startIndex + index + 1,
      };
    });
  }, [columns, currentPage, effectivePageSize, pagination]);

  /**
   * Saat table memakai summary row untuk total laporan, vertical scroll AntD
   * membuat scrollbar berada tepat di atas total row sehingga total terlihat
   * seperti terpisah dari data. Untuk kasus ini hanya horizontal scroll yang
   * dipertahankan, sementara tinggi table mengikuti jumlah data yang tampil.
   */
  const effectiveScroll = useMemo(() => {
    if (!summaryRow || !scroll?.y) return scroll;
    const restScroll = { ...scroll };
    delete restScroll.y;
    return restScroll;
  }, [scroll, summaryRow]);

  const fixedColumnSx = {
    "--reusable-fixed-bg":
      muiTheme.palette.mode === "dark" ? "#111111" : "#ffffff",
    "--reusable-fixed-header-bg":
      muiTheme.palette.mode === "dark" ? "#1c1c1c" : "#f8f9fb",
    "--reusable-fixed-hover-bg":
      muiTheme.palette.mode === "dark" ? "#181818" : "#f5f6f8",
    "--reusable-fixed-total-bg":
      muiTheme.palette.mode === "dark" ? "#21190c" : "#fff3f3",
    "--reusable-row-bg":
      muiTheme.palette.mode === "dark" ? "#111111" : "#ffffff",
    "--reusable-row-hover-bg":
      muiTheme.palette.mode === "dark" ? "#181818" : "#f5f6f8",
    /**
     * AntD memakai layer sticky terpisah untuk fixed column. Semua cell table
     * dibuat punya background solid agar teks dari kolom yang sedang discroll
     * tidak terlihat menembus fixed column atau baris total laporan.
     */
    "& .ant-table, & .ant-table-container, & .ant-table-content, & .ant-table-body": {
      background: "var(--reusable-row-bg) !important",
      backgroundColor: "var(--reusable-row-bg) !important",
    },
    "& .ant-table-thead > tr > th": {
      background: "var(--reusable-fixed-header-bg) !important",
      backgroundColor: "var(--reusable-fixed-header-bg) !important",
      backgroundImage: "none !important",
    },
    "& .ant-table-tbody > tr > td": {
      background: "var(--reusable-row-bg) !important",
      backgroundColor: "var(--reusable-row-bg) !important",
      backgroundImage: "none !important",
      backgroundClip: "border-box !important",
    },
    "& .ant-table-tbody > tr:hover > td": {
      background: "var(--reusable-row-hover-bg) !important",
      backgroundColor: "var(--reusable-row-hover-bg) !important",
    },
    "& .ant-table-cell-fix-left, & .ant-table-cell-fix-left-first, & .ant-table-cell-fix-left-last, & .ant-table-cell-fix-right, & .ant-table-cell-fix-right-first, & .ant-table-cell-fix-right-last": {
      background: "var(--reusable-fixed-bg) !important",
      backgroundColor: "var(--reusable-fixed-bg) !important",
      backgroundImage: "none !important",
      backgroundClip: "border-box !important",
      opacity: "1 !important",
      zIndex: "20 !important",
      isolation: "isolate",
    },
    "& .ant-table-thead .ant-table-cell-fix-left, & .ant-table-thead .ant-table-cell-fix-left-first, & .ant-table-thead .ant-table-cell-fix-left-last, & .ant-table-thead .ant-table-cell-fix-right, & .ant-table-thead .ant-table-cell-fix-right-first, & .ant-table-thead .ant-table-cell-fix-right-last": {
      background: "var(--reusable-fixed-header-bg) !important",
      backgroundColor: "var(--reusable-fixed-header-bg) !important",
      zIndex: "24 !important",
    },
    "& .ant-table-tbody > tr.ant-table-row > td.ant-table-cell-fix-left, & .ant-table-tbody > tr.ant-table-row > td.ant-table-cell-fix-left-first, & .ant-table-tbody > tr.ant-table-row > td.ant-table-cell-fix-left-last, & .ant-table-tbody > tr.ant-table-row > td.ant-table-cell-fix-right, & .ant-table-tbody > tr.ant-table-row > td.ant-table-cell-fix-right-first, & .ant-table-tbody > tr.ant-table-row > td.ant-table-cell-fix-right-last": {
      background: "var(--reusable-fixed-bg) !important",
      backgroundColor: "var(--reusable-fixed-bg) !important",
    },
    "& .ant-table-tbody > tr:hover > td.ant-table-cell-fix-left, & .ant-table-tbody > tr:hover > td.ant-table-cell-fix-left-first, & .ant-table-tbody > tr:hover > td.ant-table-cell-fix-left-last, & .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right, & .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right-first, & .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right-last": {
      background: "var(--reusable-fixed-hover-bg) !important",
      backgroundColor: "var(--reusable-fixed-hover-bg) !important",
    },
    "& .ant-table-cell-fix-left-last::after, & .ant-table-cell-fix-right-first::after": {
      pointerEvents: "none",
      zIndex: 1,
    },
    "& .ant-table-tbody > tr.report-total-row > td": {
      background: "var(--reusable-fixed-total-bg) !important",
      backgroundColor: "var(--reusable-fixed-total-bg) !important",
      borderTop: `1px solid ${muiTheme.palette.primary.main} !important`,
      fontWeight: "700 !important",
    },
    "& .ant-table-tbody > tr.report-total-row > td.ant-table-cell-fix-left, & .ant-table-tbody > tr.report-total-row > td.ant-table-cell-fix-right": {
      background: "var(--reusable-fixed-total-bg) !important",
      backgroundColor: "var(--reusable-fixed-total-bg) !important",
    },
    "& .ant-table-summary > tr > td": {
      background: "var(--reusable-fixed-total-bg) !important",
      backgroundColor: "var(--reusable-fixed-total-bg) !important",
      borderTop: `1px solid ${muiTheme.palette.primary.main} !important`,
      fontWeight: "700 !important",
    },
    "& .ant-table-summary > tr > td.ant-table-cell-fix-left, & .ant-table-summary > tr > td.ant-table-cell-fix-right": {
      background: "var(--reusable-fixed-total-bg) !important",
      backgroundColor: "var(--reusable-fixed-total-bg) !important",
      backgroundImage: "none !important",
      opacity: "1 !important",
      zIndex: "22 !important",
    },
  };

  const actionColumnSx = fixedActionColumn
    ? {
        "--reusable-action-bg":
          muiTheme.palette.mode === "dark" ? "#111111" : "#ffffff",
        "--reusable-action-header-bg":
          muiTheme.palette.mode === "dark" ? "#1c1c1c" : "#f8f9fb",
        "--reusable-action-hover-bg":
          muiTheme.palette.mode === "dark" ? "#181818" : "#f5f6f8",
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

  const renderSummaryCell = (column, index) => {
    const value = column?.dataIndex ? summaryRow?.[column.dataIndex] : undefined;
    const content =
      typeof column?.render === "function"
        ? column.render(value, summaryRow, -1)
        : value;

    return (
      <Table.Summary.Cell
        key={column?.key || column?.dataIndex || index}
        index={index}
        align={column?.align}
        fixed={column?.fixed}
      >
        {content}
      </Table.Summary.Cell>
    );
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
                ? "rgba(255,255,255,0.045)"
                : "rgba(17,24,39,0.035)",
          },
        },
      }}
    >
      <Box sx={[fixedColumnSx, actionColumnSx, sx]}>
        <Table
          rowKey={rowKey}
          columns={columnsWithAutoNumber}
          dataSource={dataSource}
          loading={loading}
          tableLayout={tableLayout}
          showSorterTooltip={{ target: "sorter-icon" }}
          scroll={effectiveScroll}
          pagination={mergedPagination}
          onChange={handleChange}
          summary={
            summaryRow
              ? () => (
                  <Table.Summary fixed>
                    <Table.Summary.Row className="report-total-row">
                      {columnsWithAutoNumber.map(renderSummaryCell)}
                    </Table.Summary.Row>
                  </Table.Summary>
                )
              : undefined
          }
          {...tableProps}
        />
      </Box>
    </ConfigProvider>
  );
}
