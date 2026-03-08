import { Route, Routes } from "react-router-dom";
import FightRecapLayout from "./layout/FightRecapLayout";
import FightRecapPage from "./pages/FightRecapPage";
import FightRecapNotFound from "./pages/FightRecapNotFound";
import FilesList from "./pages/FilesList";
import { FightRecapVideosProvider } from "./context/FightRecapVideosContext";

export default function FightRecapRoutes() {
  return (
    <FightRecapVideosProvider>
      <Routes>
        <Route element={<FightRecapLayout />}>
          <Route index element={<FilesList />} />
          <Route path="annotate/:id" element={<FightRecapPage />} />
          <Route path="*" element={<FightRecapNotFound />} />
        </Route>
      </Routes>
    </FightRecapVideosProvider>
  );
}
