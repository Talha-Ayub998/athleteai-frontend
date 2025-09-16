import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import VideoUploadComponent from "./components/VideoUploadComponent ";

const VideoURL = () => {
  return (
    <div>
      <PageBreadcrumb pageTitle={"Video URL"} path={"Video URL"} />
      <VideoUploadComponent />

      <div className="py-32" />
    </div>
  );
};

export default VideoURL;
