import { useCallback } from "react";
import { Route, Routes } from "react-router-dom";
import FightRecapLayout from "./layout/FightRecapLayout";
import FightRecapPage from "./pages/FightRecapPage";
import FightRecapNotFound from "./pages/FightRecapNotFound";
import { FightRecapVideosProvider, useFightRecapVideos } from "./context/FightRecapVideosContext";
import { UploadProvider } from "./context/UploadContext";
import VideosList from "./pages/VideosList";
import UploadVideoPage from "./pages/UploadVideoPage";

function FightRecapRoutesInner() {
  const { fetchVideos } = useFightRecapVideos();
  const handleUploadSuccess = useCallback(() => fetchVideos(true), [fetchVideos]);

  return (
    <UploadProvider onSuccess={handleUploadSuccess}>
      <Routes>
        <Route element={<FightRecapLayout />}>
          <Route index element={<VideosList />} />
          <Route path="upload" element={<UploadVideoPage />} />
          <Route path="annotate/:id" element={<FightRecapPage />} />
          <Route path="*" element={<FightRecapNotFound />} />
        </Route>
      </Routes>
    </UploadProvider>
  );
}

export default function FightRecapRoutes() {
  return (
    <FightRecapVideosProvider>
      <FightRecapRoutesInner />
    </FightRecapVideosProvider>
  );
}
