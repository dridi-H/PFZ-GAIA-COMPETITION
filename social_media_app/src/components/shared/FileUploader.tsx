import { useCallback, useState } from "react";
import { FileWithPath, useDropzone } from "react-dropzone";

import { Button } from "@/components/ui";
import { convertFileToUrl } from "@/lib/utils";

type FileUploaderProps = {
  fieldChange: (files: File[]) => void;
  mediaUrl: string;
  isOptional?: boolean;
};

const FileUploader = ({ fieldChange, mediaUrl, isOptional = false }: FileUploaderProps) => {
  const [file, setFile] = useState<File[]>([]);
  const [fileUrl, setFileUrl] = useState<string>(mediaUrl);

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      setFile(acceptedFiles);
      fieldChange(acceptedFiles);
      setFileUrl(convertFileToUrl(acceptedFiles[0]));
    },
    [file]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpeg", ".jpg"],
    },
  });

  // Compact optional mode
  if (isOptional && !fileUrl) {
    return (
      <div className="flex flex-col gap-2">
        <div 
          {...getRootProps()}
          className="flex items-center gap-3 p-4 border-2 border-dashed border-dark-4 rounded-lg cursor-pointer hover:border-primary-500 transition-colors"
        >
          <img src="/assets/icons/file-upload.svg" className="h-6 w-6" alt="upload" />
          <div>
            <p className="text-light-2 small-medium">Click to add a photo</p>
            <p className="text-light-4 tiny-medium">SVG, PNG, JPG (optional)</p>
          </div>
        </div>
        <input {...getInputProps()} className="cursor-pointer" />
      </div>
    );
  }
  // Regular mode (existing functionality)
  return (
    <div
      {...getRootProps()}
      className="flex flex-center flex-col bg-dark-3 rounded-xl cursor-pointer">
      <input {...getInputProps()} className="cursor-pointer" />

      {fileUrl ? (
        <>
          <div className="flex flex-1 justify-center w-full p-5 lg:p-10">
            <img src={fileUrl} alt="image" className="file_uploader-img" />
          </div>
          <p className="file_uploader-label">Click or drag photo to replace</p>
        </>
      ) : (
        <div className="file_uploader-box ">
          <img
            src="/assets/icons/file-upload.svg"
            width={96}
            height={77}
            alt="file upload"
          />

          <h3 className="base-medium text-light-2 mb-2 mt-6">
            Drag photo here
          </h3>
          <p className="text-light-4 small-regular mb-6">SVG, PNG, JPG</p>

          <Button type="button" className="shad-button_dark_4">
            Select from computer
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
