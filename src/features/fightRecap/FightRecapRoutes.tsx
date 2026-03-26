import { Route, Routes } from "react-router-dom";
import FightRecapLayout from "./layout/FightRecapLayout";
import FightRecapPage from "./pages/FightRecapPage";
import FightRecapNotFound from "./pages/FightRecapNotFound";
import { FightRecapVideosProvider } from "./context/FightRecapVideosContext";
import VideosList from "./pages/VideosList";
import UploadVideoPage from "./pages/UploadVideoPage";

export default function FightRecapRoutes() {
  return (
    <FightRecapVideosProvider>
      <Routes>
        <Route element={<FightRecapLayout />}>
          <Route index element={<VideosList />} />
          <Route path="upload" element={<UploadVideoPage />} />
          <Route path="annotate/:id" element={<FightRecapPage />} />
          <Route path="*" element={<FightRecapNotFound />} />
        </Route>
      </Routes>
    </FightRecapVideosProvider>
  );
}
