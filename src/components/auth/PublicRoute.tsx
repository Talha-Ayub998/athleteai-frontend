import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../../utils/auth";

export default function PublicRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/reports" /> : children;
}
