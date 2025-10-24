import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Icon } from "@iconify/react";

const menuItemDirekturUtama = [
  {
    label: "Dashboard",
    value: "dashboard",
    path: "/direktur-utama/dashboard",
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
        path: "/direktur-utama/tenant-approval",
        icon: <Icon icon="carbon:document-set" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Termination Approval",
        value: "tenant-terminations-approval",
        path: "/direktur-utama/tenant-terminations-approval",
        icon: <Icon icon="pepicons-pop:lock-closed-circle" fontSize="20px" />,
        showIcon: true,
      },
      // {
      //   label: "Contracts",
      //   value: "contracts",
      //   path: "/direktur-utama/contracts",
      //   icon: <Icon icon="clarity:contract-line" fontSize="20px" />,
      //   showIcon: true,
      // },
    ],
  },
  {
    label: "Reports",
    value: "reports",
    icon: <Icon icon="fluent:chart-multiple-16-filled" fontSize={23} />,
    submenu: [
      {
        label: "Report By Locations",
        value: "locations-report",
        path: "/direktur-utama/locations-report",
        icon: <Icon icon="ant-design:pie-chart-filled" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Report By Tenants",
        value: "tenants-report",
        path: "/direktur-utama/tenants-report",
        icon: <Icon icon="bi:bar-chart-fill" fontSize="18px" />,
        showIcon: true,
      },
    ],
  },
  // Tambahkan menu lain jika perlu
];

export default menuItemDirekturUtama;
