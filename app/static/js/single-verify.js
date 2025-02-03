
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
    const singleVerifyForm = document.getElementById("singleVerifyForm");
    const resultContainer = document.getElementById("resultContainer");
  
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
  
    singleVerifyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      resultContainer.style.display = "none"; 
  
      const firstName = document.getElementById("firstName").value.trim();
      const lastName = document.getElementById("lastName").value.trim();
      const email = document.getElementById("email").value.trim();
      const phoneNumber = document.getElementById("phoneNumber").value.trim();
  
      if (!firstName || !lastName || !email || !phoneNumber) {
        showResult("Please fill in all required fields.", false);
        return;
      }
  
      try {
        const response = await fetch("/verify-phone", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            phoneNumber
          })
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          const errMsg = data.error || "An error occurred during verification.";
          showResult(errMsg, false);
        } else {
          if (data.alreadyExists) {
            const msg = `Phone already exists.\nName: ${data.firstName} ${data.lastName}\nEmail: ${data.email}\nStatus: ${data.status}`;
            showResult(msg, true);
          } else if (data.valid) {

            const msg = `Phone number verified!\nE164: ${data.phone_number}\nLine Type: ${data.line_type}\nCarrier: ${data.carrier_name}`;
            showResult(msg, true);
          } else {
            const reasons = data.reasons.join(", ");
            const msg = `Number is INVALID. Reasons: ${reasons}`;
            showResult(msg, false);
          }
        }
      } catch (error) {
        console.error("Error while verifying phone:", error);
        showResult("Error contacting server. Please try again.", false);
      }
    });
  
    function showResult(message, isSuccess) {
      resultContainer.style.display = "block";
      resultContainer.textContent = message;
      if (isSuccess) {
        resultContainer.classList.remove("error");
        resultContainer.classList.add("success");
      } else {
        resultContainer.classList.remove("success");
        resultContainer.classList.add("error");
      }
    }
  });
  