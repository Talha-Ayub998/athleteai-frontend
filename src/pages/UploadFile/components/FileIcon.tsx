import FileIcon from "../../../components/common/FileIcon";

const FileIconSection = ({ file }) => {
  return (
    <div className="flex-shrink-0 mr-3">
      {file.preview ? (
        <img
          src={file.preview}
          alt={file.name}
          className="w-10 h-10 object-cover rounded-md"
        />
      ) : (
        <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-md flex items-center justify-center">
          <FileIcon fileName={file.type} />
        </div>
      )}
    </div>
  );
};

export default FileIconSection;
