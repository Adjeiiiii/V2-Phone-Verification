function toggleUserDropdown() {
    const dropdown = document.getElementById("userDropdown");
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
  }
  
  function openLogoutModal(event) {
    event.preventDefault();
    document.getElementById("logoutModal").style.display = "flex";
  }
  
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("userDropdown");
    const profileIcon = document.getElementById("profileIcon");
    if (
      dropdown.style.display === "block" &&
      e.target !== dropdown &&
      !dropdown.contains(e.target) &&
      e.target !== profileIcon &&
      !profileIcon.contains(e.target)
    ) {
      dropdown.style.display = "none";
    }
  });
  
  document.addEventListener("DOMContentLoaded", () => {
    const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
    const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");
    const logoutModal = document.getElementById("logoutModal");
  
    confirmLogoutBtn.addEventListener("click", () => {
      window.location.href = "/logout";
    });
  
    cancelLogoutBtn.addEventListener("click", () => {
      logoutModal.style.display = "none";
    });
  });
  