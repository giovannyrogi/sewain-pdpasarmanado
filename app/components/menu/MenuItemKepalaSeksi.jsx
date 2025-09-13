import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Icon } from "@iconify/react";

const menuKepalaSeksi = [
  {
    label: "Dashboard",
    value: "dashboard",
    path: "/kepala-seksi/dashboard",
    icon: <Icon icon="svg-spinners:blocks-scale" fontSize="20px" />,
  },
  {
    label: "Transactions",
    value: "transactions",
    icon: <Icon icon="healthicons:money-bag" fontSize={22} />,
    submenu: [
      {
        label: "Tenant Approval",
        value: "tenant-approval",
        path: "/kepala-seksi/tenant-approval",
        icon: <Icon icon="carbon:document-set" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Tenant Terminations",
        value: "tenant-terminations",
        path: "/kepala-seksi/tenant-terminations",
        icon: <Icon icon="pepicons-pop:lock-closed-circle" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Payments",
        value: "payments",
        path: "/kepala-seksi/payments",
        icon: (
          <Icon icon="streamline-freehand:money-atm-withdraw" fontSize="20px" />
        ),
        showIcon: true,
      },
      {
        label: "Contracts",
        value: "contracts",
        path: "/kepala-seksi/contracts",
        icon: <Icon icon="clarity:contract-line" fontSize="20px" />,
        showIcon: true,
      },
    ],
  },
  {
    label: "Report",
    value: "report",
    icon: <Icon icon="line-md:document-report-twotone" fontSize={23} />,
    submenu: [
      {
        label: "Laporan 1",
        value: "laporan1",
        path: "/kepala-seksi/laporan1",
        icon: <LocationOnIcon />,
        showIcon: false,
      },
      {
        label: "Laporan 2",
        value: "laporan2",
        path: "/kepala-seksi/laporan2",
        icon: <PeopleIcon />,
        showIcon: false,
      },
    ],
  },
  // Tambahkan menu lain jika perlu
];

export default menuKepalaSeksi;
