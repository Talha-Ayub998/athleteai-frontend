import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import VideoUploadComponent from "./components/VideoUploadComponent ";

const VideoURL = () => {
  return (
    <div>
      <PageBreadcrumb pageTitle={"Video URL"} path={"Video URL"} />
      <VideoUploadComponent />
    </div>
  );
};

export default VideoURL;
