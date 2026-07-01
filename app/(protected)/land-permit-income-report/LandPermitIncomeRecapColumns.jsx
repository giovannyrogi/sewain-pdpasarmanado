"use client";

import React from "react";
import formatRupiah from "@/app/components/formatrupiah/page";
import {
  LandPermitIncomeCellText,
  keepLandPermitIncomeTotalAtBottom,
  normalizeLandPermitIncomeSearch,
} from "@/app/components/reports/LandPermitIncomeReportShared";

export const LAND_PERMIT_INCOME_RECAP_SCROLL_WIDTH = 640;

export const buildLandPermitIncomeRecapTotalRow = (rows = []) => ({
  key: "land-permit-income-recap-total",
  __isTotal: true,
  summary_label: "TOTAL",
  location_name: "TOTAL",
  trader_count: rows.reduce(
    (sum, row) => sum + Number(row.trader_count || 0),
    0,
  ),
  total_income: rows.reduce(
    (sum, row) => sum + Number(row.total_income || 0),
    0,
  ),
});

export const filterLandPermitIncomeRecapRows = (rows = [], searchText = "") => {
  const keyword = normalizeLandPermitIncomeSearch(searchText);
  if (!keyword) return rows;

  return rows.filter((row) =>
    [row.location_name]
      .map(normalizeLandPermitIncomeSearch)
      .some((value) => value.includes(keyword)),
  );
};

export const createLandPermitIncomeRecapColumns = () => [
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

export const LAND_PERMIT_INCOME_RECAP_EXPORT_COLUMNS = [
  { key: "no", header: "No", width: 8, pdfWidth: 9, pdfHalign: "center" },
  { key: "location_name", header: "Lokasi", width: 24, pdfWidth: 86 },
  { key: "trader_count", header: "Jumlah Pedagang", width: 18, pdfWidth: 42 },
  {
    key: "total_income",
    header: "Total Pendapatan",
    type: "currency",
    width: 22,
    pdfWidth: 46,
  },
];

export const buildLandPermitIncomeRecapExportRows = (rows = []) =>
  rows.map((row, index) => ({
    no: index + 1,
    location_name: row.location_name || "-",
    trader_count: Number(row.trader_count || 0),
    total_income: Number(row.total_income || 0),
  }));
