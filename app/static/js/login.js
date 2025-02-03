document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const errorDiv = document.getElementById("loginError");
  
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
  
      errorDiv.style.display = "none";
      errorDiv.innerText = "";
  
      const email = document.getElementById("emailInput").value;
      const password = document.getElementById("passwordInput").value;
  
      try {
        const response = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
  
        if (response.redirected) {
          window.location.href = response.url;
          return;
        }
  
        const data = await response.json();
        if (data.error) {
          errorDiv.style.display = "block";
          errorDiv.innerText = data.error;
        }
      } catch (err) {
        console.error("Login error:", err);
        errorDiv.style.display = "block";
        errorDiv.innerText = "An unexpected error occurred while logging in.";
      }
    });
  });
  