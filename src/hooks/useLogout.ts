import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";

const useLogout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { clearUserContext, setUserLoading } = useUserContext();

  // useCallback memoizes the logout function to prevent unnecessary re-renders
  const logout = useCallback(() => {
    setIsLoggingOut(true); // Indicate that logout is in progress
    setUserLoading(true); // Set user loading state to show loader

    // Simulate an asynchronous logout process, e.g., an API call to invalidate a session.
    // In a real application, you would replace this setTimeout with your actual API call.
    setTimeout(() => {
      localStorage.removeItem("authToken");
      clearUserContext();
      setIsLoggingOut(false); // Reset logging out state
      setUserLoading(false); // Reset loading state
      navigate("/login", { replace: true });
    }, 500); // Simulated network delay
  }, [navigate, clearUserContext, setUserLoading]); // Added all dependencies

  return { logout, isLoggingOut };
};

export default useLogout;
