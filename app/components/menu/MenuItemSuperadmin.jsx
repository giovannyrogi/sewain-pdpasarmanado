import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Icon } from "@iconify/react";

const menuSuperAdmin = [
  {
    label: "Dashboard",
    value: "dashboard",
    path: "/superadmin/dashboard",
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
        path: "/superadmin/locations",
        icon: <Icon icon="mdi:location-radius-outline" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Floor",
        value: "floor",
        path: "/superadmin/floor",
        icon: <Icon icon="ion:pricetags-outline" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Rooms",
        value: "rooms",
        path: "/superadmin/rooms",
        icon: <Icon icon="cil:room" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Identity Lists",
        value: "identity-lists",
        path: "/superadmin/identity-lists",
        icon: <Icon icon="qlementine-icons:id-card-16" fontSize="20px" />,
        showIcon: true,
      },
    ],
  },
  {
    label: "Transactions",
    value: "transactions",
    icon: <Icon icon="healthicons:money-bag" fontSize="20px" />,
    submenu: [
      {
        label: "Tenant Application",
        value: "tenant-application",
        path: "/superadmin/tenant-application",
        icon: <Icon icon="hugeicons:file-edit" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Tenant Terminations",
        value: "tenant-terminations",
        path: "/superadmin/tenant-terminations",
        icon: <Icon icon="pepicons-pop:lock-closed-circle" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Payments",
        value: "payments",
        path: "/superadmin/payments",
        icon: (
          <Icon icon="streamline-freehand:money-atm-withdraw" fontSize="20px" />
        ),
        showIcon: true,
      },
      {
        label: "Contracts",
        value: "contracts",
        path: "/superadmin/contracts",
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
        path: "/superadmin/locations-report",
        icon: <Icon icon="ant-design:pie-chart-filled" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Report By Tenants",
        value: "tenants-report",
        path: "/superadmin/tenants-report",
        icon: <Icon icon="bi:bar-chart-fill" fontSize="18px" />,
        showIcon: true,
      },
    ],
  },
];

export default menuSuperAdmin;
