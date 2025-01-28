document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    const signupError = document.getElementById("signupError");
  
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
  
      // Hide old error message
      signupError.style.display = "none";
      signupError.innerText = "";
  
      // Gather values
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const signupKey = document.getElementById("signup-key").value;
  
      try {
        const response = await fetch("/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            signup_key: signupKey
          })
        });
  
        if (!response.ok) {
          // parse error
          const data = await response.json();
          signupError.style.display = "block";
          signupError.innerText = data.error || "Signup error.";
        } else {
          // success
          const data = await response.json();
          signupError.style.display = "block";
          signupError.style.color = "green";
          signupError.innerText = data.message || "User created successfully!";
          // optionally redirect
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        }
      } catch (err) {
        console.error("Signup request failed:", err);
        signupError.style.display = "block";
        signupError.innerText = "Error contacting the server.";
      }
    });
  });
  