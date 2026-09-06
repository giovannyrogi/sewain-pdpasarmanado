import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, CssBaseline, Button } from "@mui/material";
import { lightTheme, darkTheme } from "../app/components/themeprovider/ThemeProvider";
import Guide from "../app/(protected)/land-permit-documents/TraderCardPrintGuide";
import { waitForTraderPrintAssets } from "../app/utils/traderCardPrinting";
window.waitForTraderPrintAssets = waitForTraderPrintAssets;
function Fixture() {
  const [open, setOpen] = useState(true);
  const mode = new URLSearchParams(window.location.search).get("theme") || "light";
  const documents = Array.from({ length: 3 }, (_, i) => ({ document_id: i + 1, tenant_name: `Pedagang ${i + 1}`, document_number: `KIP-${i + 1}`, administration_type: i === 1 ? "kkip" : "kip" }));
  return <ThemeProvider theme={mode === "dark" ? darkTheme : lightTheme}><CssBaseline /><Button onClick={() => setOpen(true)}>Buka</Button><Guide open={open} documents={documents} onClose={() => setOpen(false)} onPrint={(items, printMode, options) => { window.lastPrint = { items, printMode, options }; }} /></ThemeProvider>;
}
createRoot(document.getElementById("root")).render(<Fixture />);
