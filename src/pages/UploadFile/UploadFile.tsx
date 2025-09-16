import React, { useContext } from "react";
import FileUpload from "./components/FileUpload";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useParams } from "react-router";
import { UserContext } from "../../context/UserContext";

const UploadFile = () => {
  const { users } = useContext(UserContext);
  const { userId } = useParams();

  const userDetails = users?.find((user) => user.id === parseInt(userId));

  return (
    <div>
      <PageBreadcrumb
        pageTitle={
          userId
            ? `File Upload - ${userDetails && userDetails?.username}`
            : "File Upload"
        }
        path={
          userId
            ? ["Users List", "File Upload", `${userDetails && userDetails?.id}`]
            : "File Upload"
        }
      />
      <FileUpload userId={Number(userId)} />

      <div className="py-32" />
    </div>
  );
};

export default UploadFile;
