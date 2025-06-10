import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const useLogout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate(); // Hook for programmatic navigation

  // useCallback memoizes the logout function to prevent unnecessary re-renders
  const logout = useCallback(() => {
    setIsLoggingOut(true); // Indicate that logout is in progress

    // Simulate an asynchronous logout process, e.g., an API call to invalidate a session.
    // In a real application, you would replace this setTimeout with your actual API call.
    setTimeout(() => {
      // 1. Remove authToken from localStorage
      localStorage.removeItem("authToken");
      console.log("authToken removed from localStorage.");

      // 2. Remove userData from localStorage
      localStorage.removeItem("userData");
      console.log("userData removed from localStorage.");

      setIsLoggingOut(false); // Reset logging out state

      // 3. Redirect the user to the login page after successful logout.
      // `replace: true` ensures the login page replaces the current entry in history,
      // preventing the user from navigating back to a protected page after logging out.
      navigate("/login", { replace: true });
      console.log("Logout successful and redirected to /login.");
    }, 500); // Simulated network delay
  }, [navigate]); // navigate is a dependency of useCallback

  return { logout, isLoggingOut };
};

export default useLogout;
