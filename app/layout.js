import { Inter, Poppins, Roboto } from "next/font/google";
import "./globals.css";
import "antd/dist/reset.css";
import "@ant-design/v5-patch-for-react-19";
import AppProviders from "./components/appprovider/AppProviders";

const inter = Inter({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const poppins = Poppins({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
});

const roboto = Roboto({
  weight: ["400", "700", "900"], // bisa 100, 300, 400, 500, 700, 900
  subsets: ["latin"], // subsetting huruf
});

export const metadata = {
  title: "Dashboard SewaIN",
  description: "Sistem Informasi SewaIN",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
