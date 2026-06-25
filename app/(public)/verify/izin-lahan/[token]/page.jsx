import {
  getLandPermitVerificationByToken,
  isValidLandPermitQrToken,
} from "@/app/utils/landPermitVerificationService";
import LandPermitVerificationClient from "./LandPermitVerificationClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cek Izin Lahan | SewaIN",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LandPermitVerificationPage({ params }) {
  const { token: rawToken } = await params;
  const token = String(rawToken || "").trim();

  if (!isValidLandPermitQrToken(token)) {
    return <LandPermitVerificationClient invalidToken />;
  }

  const data = await getLandPermitVerificationByToken(token);

  return <LandPermitVerificationClient data={data} />;
}
