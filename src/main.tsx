import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { ReportsProvider } from "./context/ReportsContext.tsx";
import { UserProvider } from "./context/UserContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <UserProvider>
        <ReportsProvider>
          <AppWrapper>
            <App />
          </AppWrapper>
        </ReportsProvider>
      </UserProvider>
    </ThemeProvider>
  </StrictMode>
);
