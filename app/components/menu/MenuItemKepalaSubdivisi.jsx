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
    label: "Data Master",
    value: "dataMaster",
    icon: <Icon icon="material-symbols:database" fontSize="20px" />,
    submenu: [
      {
        label: "Locations",
        value: "locations",
        path: "/kepala-subdivisi/locations",
        icon: <Icon icon="mdi:location-radius-outline" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Floor",
        value: "floor",
        path: "/kepala-subdivisi/floor",
        icon: <Icon icon="ion:pricetags-outline" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Rooms",
        value: "rooms",
        path: "/kepala-subdivisi/rooms",
        icon: <Icon icon="cil:room" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Identity Lists",
        value: "identity-lists",
        path: "/kepala-subdivisi/identity-lists",
        icon: <Icon icon="qlementine-icons:id-card-16" fontSize="20px" />,
        showIcon: true,
      },
    ],
  },
  {
    label: "Transactions",
    value: "transactions",
    icon: <Icon icon="healthicons:money-bag" fontSize={22} />,
    submenu: [
      {
        label: "Tenant Application",
        value: "tenant-application",
        path: "/kepala-subdivisi/tenant-application",
        icon: <Icon icon="hugeicons:file-edit" fontSize="20px" />,
        showIcon: true,
      },
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
        path: "/kepala-subdivisi/tenant-termination",
        icon: <Icon icon="pepicons-pop:lock-closed-circle" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Termination Approval",
        value: "tenant-terminations-approval",
        path: "/kepala-subdivisi/tenant-termination-approval",
        icon: <Icon icon="pepicons-pop:lock-closed-circle" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Payments",
        value: "payments",
        path: "/kepala-subdivisi/payments",
        icon: (
          <Icon icon="streamline-freehand:money-atm-withdraw" fontSize="20px" />
        ),
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
    label: "Reports",
    value: "reports",
    icon: <Icon icon="fluent:chart-multiple-16-filled" fontSize={23} />,
    submenu: [
      {
        label: "Report By Locations",
        value: "locations-report",
        path: "/kepala-subdivisi/locations-report",
        icon: <Icon icon="ant-design:pie-chart-filled" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Report By Tenants",
        value: "tenants-report",
        path: "/kepala-subdivisi/tenants-report",
        icon: <Icon icon="bi:bar-chart-fill" fontSize="18px" />,
        showIcon: true,
      },
    ],
  },
  // Tambahkan menu lain jika perlu
];

export default menuKepalaSubdivisi;
