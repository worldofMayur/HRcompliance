export function logActiveSession() {
  const token = localStorage.getItem("access_token");
  const username = localStorage.getItem("username");
  const email = localStorage.getItem("email");

  if (token && username) {
    console.log("✅ Active Session:");
    console.log("Username:", username);
    console.log("Email:", email);
  } else {
    console.log("❌ No active session");
  }
}
