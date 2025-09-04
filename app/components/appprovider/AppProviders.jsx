"use client";
import { ThemeModeProvider } from "../themeprovider/ThemeContext";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";

export default function AppProviders({ children }) {
  return (
    <ThemeModeProvider>
      <LocalizationProvider
        dateAdapter={AdapterMoment}
        adapterLocale="id"
        localeText={moment.locale("id")}
      >
        {children}
      </LocalizationProvider>
    </ThemeModeProvider>
  );
}
