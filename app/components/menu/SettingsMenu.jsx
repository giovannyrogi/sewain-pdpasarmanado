import { Icon } from "@iconify/react";

const settingsMenu = {
  label: "Settings",
  value: "settings",
  icon: <Icon icon="line-md:cog-filled-loop" fontSize={22} />, // Ganti dengan icon yang kamu suka
  submenu: [
    {
      label: "Profile",
      value: "profile",
      showIcon: false,
      icon: <Icon icon="mdi:account-circle-outline" fontSize={20} />,
    },
    {
      label: "Theme",
      value: "theme",
      showIcon: false,
      icon: <Icon icon="mdi:theme-light-dark" fontSize={20} />,
    },
  ],
};

export default settingsMenu;
