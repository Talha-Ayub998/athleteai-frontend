/**
 * Helper function to check if the user is currently authenticated.
 * It verifies the presence of 'authToken' and 'userData' in localStorage.
 *
 * @returns {boolean} True if the user is authenticated, false otherwise.
 */
export const isAuthenticated = () => {
  const authToken = localStorage.getItem("authToken");

  // A user is considered authenticated if both an auth token and user data exist.
  return !!authToken;
};
