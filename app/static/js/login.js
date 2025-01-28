document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const errorDiv = document.getElementById("loginError");
  
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
  
      // Hide any old error message
      errorDiv.style.display = "none";
      errorDiv.innerText = "";
  
      // Gather inputs
      const email = document.getElementById("emailInput").value;
      const password = document.getElementById("passwordInput").value;
  
      try {
        // Send JSON to /login
        const response = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
  
        if (response.redirected) {
          // If valid credentials, Flask returns a redirect to /home
          window.location.href = response.url;
          return;
        }
  
        // Otherwise, parse JSON for potential error
        const data = await response.json();
        if (data.error) {
          // Show the error in #loginError
          errorDiv.style.display = "block";
          errorDiv.innerText = data.error;
        }
      } catch (err) {
        console.error("Login error:", err);
        // Show a generic error
        errorDiv.style.display = "block";
        errorDiv.innerText = "An unexpected error occurred while logging in.";
      }
    });
  });
  