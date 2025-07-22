import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
// Import your pages and components
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

import PublicRoute from "./components/auth/PublicRoute";
import PrivateRoute from "./components/auth/PrivateRoute";
import UploadFile from "./pages/UploadFile/UploadFile";
import ReportsList from "./pages/Reports/ReportsList/ReportsList";
import Report from "./pages/Reports/Report/Report";
import { useEffect, useState } from "react";
import { useUserContext } from "./context/UserContext";
import UsersList from "./pages/UsersList/UsersList";

export default function App() {
  const { user, loadUser } = useUserContext();
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await loadUser();
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [loadUser]);

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <svg
          className="animate-spin h-8 w-8 text-brand-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  // If not logged in, fallback to normal router (PublicRoute/PrivateRoute will handle redirect)
  // If user is loaded, check role
  const isAdmin = user?.role === "admin";
  const isAthlete = user?.role === "athlete";

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          }
        />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ForgotPassword />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          {/* Index route - Home component renders at / */}
          <Route index element={<Navigate to="reports" />} />

          {/* Admin: all routes, Athlete: only reports, report detail, upload-file */}
          {isAdmin && (
            <>
              {/* All other protected routes for admin */}
              {/* <Route path="home" element={<Home />} /> */}
              <Route path="reports" element={<ReportsList />} />
              <Route path="reports/:reportId" element={<Report />} />
              <Route path="upload-file" element={<UploadFile />} />
              <Route path="users" element={<UsersList />} />
              <Route path="users/:userId/reports" element={<ReportsList />} />
              <Route
                path="users/:userId/reports/:reportId"
                element={<Report />}
              />
              <Route
                path="users/:userId/upload-file"
                element={<UploadFile />}
              />
            </>
          )}
          {isAthlete && (
            <>
              <Route path="reports" element={<ReportsList />} />
              <Route path="reports/:reportId" element={<Report />} />
              <Route path="upload-file" element={<UploadFile />} />
            </>
          )}
        </Route>

        {/* UI routes */}
        <Route path="profile" element={<UserProfiles />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="blank" element={<Blank />} />
        <Route path="form-elements" element={<FormElements />} />
        <Route path="basic-tables" element={<BasicTables />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="avatars" element={<Avatars />} />
        <Route path="badge" element={<Badges />} />
        <Route path="buttons" element={<Buttons />} />
        <Route path="images" element={<Images />} />
        <Route path="videos" element={<Videos />} />
        <Route path="line-chart" element={<LineChart />} />
        <Route path="bar-chart" element={<BarChart />} />

        {/* Fallback for any unmatched routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
