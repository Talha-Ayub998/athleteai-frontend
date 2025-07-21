import { useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const useLogout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate(); // Hook for programmatic navigation

  const { clearUserContext } = useContext(UserContext);

  // useCallback memoizes the logout function to prevent unnecessary re-renders
  const logout = useCallback(() => {
    setIsLoggingOut(true); // Indicate that logout is in progress

    // Simulate an asynchronous logout process, e.g., an API call to invalidate a session.
    // In a real application, you would replace this setTimeout with your actual API call.
    setTimeout(() => {
      localStorage.removeItem("authToken");
      clearUserContext();
      setIsLoggingOut(false); // Reset logging out state
      navigate("/login", { replace: true });
    }, 500); // Simulated network delay
  }, [navigate]); // navigate is a dependency of useCallback

  return { logout, isLoggingOut };
};

export default useLogout;
