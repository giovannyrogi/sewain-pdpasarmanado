"use client";

import React from "react";
import formatRupiah from "@/app/components/formatrupiah/page";
import {
  LandPermitIncomeCellText,
  keepLandPermitIncomeTotalAtBottom,
  normalizeLandPermitIncomeSearch,
} from "@/app/components/reports/LandPermitIncomeReportShared";

export const LAND_PERMIT_INCOME_SECTOR_RECAP_SCROLL_WIDTH = 760;

export const buildLandPermitIncomeSectorTotalRow = (rows = []) => ({
  key: "land-permit-income-sector-total",
  __isTotal: true,
  summary_label: "TOTAL",
  location_name: "TOTAL",
  sector_name: "",
  trader_count: rows.reduce(
    (sum, row) => sum + Number(row.trader_count || 0),
    0,
  ),
  total_income: rows.reduce(
    (sum, row) => sum + Number(row.total_income || 0),
    0,
  ),
});

export const filterLandPermitIncomeSectorRows = (rows = [], searchText = "") => {
  const keyword = normalizeLandPermitIncomeSearch(searchText);
  if (!keyword) return rows;

  return rows.filter((row) =>
    [row.location_name, row.sector_name]
      .map(normalizeLandPermitIncomeSearch)
      .some((value) => value.includes(keyword)),
  );
};

export const createLandPermitIncomeSectorColumns = ({ isMobile } = {}) => [
  {
    title: "No",
    dataIndex: "index",
    width: 72,
    align: "center",
  },
  {
    title: "Lokasi",
    dataIndex: "location_name",
    sorter: (a, b) =>
      keepLandPermitIncomeTotalAtBottom(a, b, () =>
        String(a.location_name || "").localeCompare(
          String(b.location_name || ""),
        ),
      ),
    render: (value, record) => (
      <LandPermitIncomeCellText strong={record.__isTotal}>
        {record.__isTotal ? "" : value || "-"}
      </LandPermitIncomeCellText>
    ),
  },
  {
    title: "Sektor",
    dataIndex: "sector_name",
    responsive: isMobile ? ["lg"] : undefined,
    sorter: (a, b) =>
      keepLandPermitIncomeTotalAtBottom(a, b, () =>
        String(a.sector_name || "").localeCompare(
          String(b.sector_name || ""),
        ),
      ),
    render: (value, record) => (
      <LandPermitIncomeCellText strong={record.__isTotal}>
        {record.__isTotal ? "" : value || "-"}
      </LandPermitIncomeCellText>
    ),
  },
  {
    title: "Jumlah Pedagang",
    dataIndex: "trader_count",
    align: "right",
    sorter: (a, b) =>
      keepLandPermitIncomeTotalAtBottom(
        a,
        b,
        () => Number(a.trader_count || 0) - Number(b.trader_count || 0),
      ),
    render: (value, record) => (
      <LandPermitIncomeCellText strong={record.__isTotal}>
        {value || 0}
      </LandPermitIncomeCellText>
    ),
  },
  {
    title: "Total Pendapatan",
    dataIndex: "total_income",
    align: "right",
    sorter: (a, b) =>
      keepLandPermitIncomeTotalAtBottom(
        a,
        b,
        () => Number(a.total_income || 0) - Number(b.total_income || 0),
      ),
    render: (value, record) => (
      <LandPermitIncomeCellText strong={record.__isTotal}>
        {formatRupiah(Number(value || 0))}
      </LandPermitIncomeCellText>
    ),
  },
];

export const LAND_PERMIT_INCOME_SECTOR_EXPORT_COLUMNS = [
  { key: "no", header: "No", width: 8, pdfWidth: 9, pdfHalign: "center" },
  { key: "location_name", header: "Lokasi", width: 24, pdfWidth: 62 },
  { key: "sector_name", header: "Sektor", width: 24, pdfWidth: 54 },
  { key: "trader_count", header: "Jumlah Pedagang", width: 18, pdfWidth: 38 },
  {
    key: "total_income",
    header: "Total Pendapatan",
    type: "currency",
    width: 22,
    pdfWidth: 44,
  },
];

export const buildLandPermitIncomeSectorExportRows = (rows = []) =>
  rows.map((row, index) => ({
    no: index + 1,
    location_name: row.location_name || "-",
    sector_name: row.sector_name || "-",
    trader_count: Number(row.trader_count || 0),
    total_income: Number(row.total_income || 0),
  }));
