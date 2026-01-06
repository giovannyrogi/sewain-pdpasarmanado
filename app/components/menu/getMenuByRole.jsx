export const getMenusByRole = (menus, roleId) => {
  return menus
    .map((menu) => {
      // cek role menu utama
      const hasMenuAccess = menu?.roles?.includes(roleId);

      // filter submenu
      const filteredSubmenu = menu?.submenu
        ? menu.submenu.filter((sub) => sub?.roles.includes(roleId))
        : [];

      // jika punya submenu
      if (menu.submenu) {
        // tampilkan parent hanya jika ada submenu yg boleh
        if (filteredSubmenu.length === 0) return null;

        return {
          ...menu,
          submenu: filteredSubmenu,
        };
      }

      // menu tanpa submenu
      if (!hasMenuAccess) return null;

      return menu;
    })
    .filter(Boolean);
};
