"use client";

import React from "react";
import TenantApplicationCreateForm from "./TenantApplicationCreateForm";
import TenantApplicationEditForm from "./TenantApplicationEditForm";

/**
 * Entry point reusable untuk modal form Tenant Application.
 * Page cukup menentukan mode create/edit, sedangkan detail field dan kalkulasi
 * tetap dipisah agar file utama halaman tidak menumpuk logic form yang besar.
 */
export default function TenantApplicationFormModal({ mode = "create", ...props }) {
  if (mode === "edit") {
    return <TenantApplicationEditForm {...props} />;
  }

  return <TenantApplicationCreateForm {...props} />;
}
