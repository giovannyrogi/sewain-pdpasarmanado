"use client";

import React from "react";
import TableActionButton from "./TableActionButton";

/**
 * Wrapper kompatibilitas untuk halaman yang sudah memakai tombol export.
 * Untuk aksi tabel non-export, gunakan TableActionButton.
 */
export default function TableExportButton(props) {
  return (
    <TableActionButton
      ariaLabel="Export data"
      label="Export"
      icon="solar:export-bold-duotone"
      {...props}
    />
  );
}
