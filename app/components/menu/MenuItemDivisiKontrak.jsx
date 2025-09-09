import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Icon } from "@iconify/react";

const menuDevisiKontrak = [
  {
    label: "Dashboard",
    value: "dashboard",
    path: "/divisi-kontrak/dashboard",
    icon: <Icon icon="svg-spinners:blocks-scale" fontSize="20px" />,
  },
  {
    label: "Data Master",
    value: "dataMaster",
    icon: <Icon icon="material-symbols:database" fontSize={20} />,
    submenu: [
      // {
      //   label: "Roles",
      //   value: "roles",
      //   path: "/divisi-kontrak/roles",
      //   icon: <Icon icon="oui:app-users-roles" fontSize="20px" />,
      //   showIcon: true,
      // },
      // {
      //   label: "Users",
      //   value: "users",
      //   path: "/divisi-kontrak/users",
      //   icon: <Icon icon="streamline-plump:user-pin" fontSize="20px" />,
      //   showIcon: true,
      // },
      {
        label: "Locations",
        value: "locations",
        path: "/divisi-kontrak/locations",
        icon: <Icon icon="mdi:location-radius-outline" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Rooms",
        value: "rooms",
        path: "/divisi-kontrak/rooms",
        icon: <Icon icon="cil:room" fontSize="20px" />,
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
        path: "/divisi-kontrak/tenant-application",
        icon: <Icon icon="hugeicons:file-edit" fontSize="20px" />,
        showIcon: true,
      },
      // {
      //   label: "Tenant Approval",
      //   value: "tenant-approval",
      //   path: "/divisi-kontrak/tenant-approval",
      //   icon: <Icon icon="carbon:document-set" fontSize="20px" />,
      //   showIcon: true,
      // },
      // {
      //   label: "Documents",
      //   value: "documents",
      //   path: "/divisi-kontrak/documents",
      //   icon: <Icon icon="f7:doc-on-doc" fontSize="20px" />,
      //   showIcon: true,
      // },
      {
        label: "Payments",
        value: "payments",
        path: "/divisi-kontrak/payments",
        icon: (
          <Icon icon="streamline-freehand:money-atm-withdraw" fontSize="20px" />
        ),
        showIcon: true,
      },
      {
        label: "Contracts",
        value: "contracts",
        path: "/divisi-kontrak/contracts",
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
        path: "/divisi-kontrak/laporan1",
        icon: <LocationOnIcon />,
        showIcon: false,
      },
      {
        label: "Laporan 2",
        value: "laporan2",
        path: "/divisi-kontrak/laporan2",
        icon: <PeopleIcon />,
        showIcon: false,
      },
    ],
  },
  // Tambahkan menu lain jika perlu
];

export default menuDevisiKontrak;
