
function toggleUserDropdown() {
  const dropdown = document.getElementById("userDropdown");
  if (dropdown.style.display === "block") {
    dropdown.style.display = "none";
  } else {
    dropdown.style.display = "block";
  }
}

function openLogoutModal(event) {
  event.preventDefault();
  const logoutModal = document.getElementById("logoutModal");
  logoutModal.style.display = "flex"; 
}

document.addEventListener("DOMContentLoaded", () => {
  const confirmBtn = document.getElementById("confirmLogoutBtn");
  const cancelBtn = document.getElementById("cancelLogoutBtn");
  const logoutModal = document.getElementById("logoutModal");
  const dropdown = document.getElementById("userDropdown");
  const profileIcon = document.getElementById("profileIcon");

  
  confirmBtn.addEventListener("click", () => {
    window.location.href = "/logout";
  });


  cancelBtn.addEventListener("click", () => {
    logoutModal.style.display = "none";
  });


  document.addEventListener("click", function(event) {

    if (
      dropdown.style.display === "block" &&

      event.target !== dropdown &&
      !dropdown.contains(event.target) &&
      event.target !== profileIcon &&
      !profileIcon.contains(event.target)
    ) {
      dropdown.style.display = "none";
    }
  });
});
