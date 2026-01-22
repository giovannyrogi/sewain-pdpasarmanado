"use client";

import Notification from "@/app/components/Notification";
import { useEffect, useState } from "react";

export default function Error({ error, reset }) {
  const [open, setOpen] = useState(true);

  return (
    <Notification
      open={open}
      severity="error"
      message={error.message || "Terjadi kesalahan"}
      onClose={() => setOpen(false)}
    />
  );
}
