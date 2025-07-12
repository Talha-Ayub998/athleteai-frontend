import React from "react";
import FileUpload from "./components/FileUpload";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

const UploadFile = () => {
  return (
    <div>
      <PageBreadcrumb pageTitle="File Upload" path={"File Upload"} />
      <FileUpload />
    </div>
  );
};

export default UploadFile;
