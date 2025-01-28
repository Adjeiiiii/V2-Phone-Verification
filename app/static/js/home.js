// home.js

// Toggle the user dropdown
function toggleUserDropdown() {
    const dropdown = document.getElementById("userDropdown");
    if (dropdown.style.display === "block") {
      dropdown.style.display = "none";
    } else {
      dropdown.style.display = "block";
    }
  }
  
  // Open the custom logout modal
  function openLogoutModal(event) {
    event.preventDefault();
    const logoutModal = document.getElementById("logoutModal");
    // Show modal
    logoutModal.style.display = "flex"; // flex so it uses justify-content/align-items
  }
  
  // This runs once the DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
    // If the user clicks "Yes" or "No" in the modal:
    const confirmBtn = document.getElementById("confirmLogoutBtn");
    const cancelBtn = document.getElementById("cancelLogoutBtn");
  
    confirmBtn.addEventListener("click", () => {
      // Redirect to /logout
      window.location.href = "/logout";
    });
  
    cancelBtn.addEventListener("click", () => {
      // Hide the modal
      const logoutModal = document.getElementById("logoutModal");
      logoutModal.style.display = "none";
    });
  });
  