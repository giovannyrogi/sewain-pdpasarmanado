import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Icon } from "@iconify/react";

const menuKepalaSubdivisi = [
  {
    label: "Dashboard",
    value: "dashboard",
    path: "/kepala-subdivisi/dashboard",
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
        path: "/kepala-subdivisi/tenant-approval",
        icon: <Icon icon="carbon:document-set" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Tenant Terminations",
        value: "tenant-terminations",
        path: "/kepala-subdivisi/tenant-terminations",
        icon: <Icon icon="pepicons-pop:lock-closed-circle" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Contracts",
        value: "contracts",
        path: "/kepala-subdivisi/contracts",
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
        path: "/kepala-subdivisi/laporan1",
        icon: <LocationOnIcon />,
        showIcon: false,
      },
      {
        label: "Laporan 2",
        value: "laporan2",
        path: "/kepala-subdivisi/laporan2",
        icon: <PeopleIcon />,
        showIcon: false,
      },
    ],
  },
  // Tambahkan menu lain jika perlu
];

export default menuKepalaSubdivisi;
