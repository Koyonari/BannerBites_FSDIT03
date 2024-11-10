import React, { useEffect, useState } from "react";
import { SketchPicker } from "react-color";
import Modal from "../Modal/Modal";
import StyledAlert from "../StyledAlert";

const EditModal = ({ ad, scheduledTime, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    content: {
      title: "",
      description: "",
      s3Bucket: "",
      s3Key: "",
      src: "",
    },
    styles: {
      font: "Arial",
      fontSize: "14px",
      textColor: "#000000",
      borderColor: "#000000",
    },
  });
  const [scheduledTimeState, setScheduledTimeState] = useState(
    scheduledTime || "00:00",
  );
  const [file, setFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [showBorderColorPicker, setShowBorderColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (message, title = "Alert", type = "info") => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  useEffect(() => {
    if (ad && ad.content) {
      const mediaUrl =
        ad.content.s3Key &&
        `https://${process.env.REACT_APP_S3_BUCKET_NAME}.s3.${process.env.REACT_APP_AWS_REGION}.amazonaws.com/${ad.content.s3Key}`;

      setFormData({
        content: {
          title: ad.content.title || "",
          description: ad.content.description || "",
          s3Bucket: ad.content.s3Bucket || "",
          s3Key: ad.content.s3Key || "",
          src: ad.content.src || mediaUrl || "",
        },
        styles: ad.styles || {
          font: "Arial",
          fontSize: "14px",
          textColor: "#000000",
          borderColor: "#000000",
        },
      });

      if (mediaUrl) {
        setMediaUrl(mediaUrl);
      }
    }
  }, [ad]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      content: {
        ...prevData.content,
        [name]: value,
      },
    }));
  };

  const handleStyleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      styles: {
        ...prevData.styles,
        [name]: value,
      },
    }));
  };

  const handleColorChange = (color, field) => {
    setFormData((prevData) => ({
      ...prevData,
      styles: {
        ...prevData.styles,
        [field]: color.hex,
      },
    }));
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsUploading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/generate-presigned-url",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: selectedFile.name,
            contentType: selectedFile.type,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching pre-signed URL:", errorData);
        showAlert("Failed to get pre-signed URL");
        return;
      }

      const { url, key } = await response.json();

      const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type,
        },
        body: selectedFile,
      });

      if (uploadResponse.ok) {
        const mediaUrlWithoutParams = url.split("?")[0];
        setFormData((prevData) => ({
          ...prevData,
          content: {
            ...prevData.content,
            s3Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
            s3Key: key,
            src: mediaUrlWithoutParams,
          },
        }));
        setMediaUrl(mediaUrlWithoutParams);
      } else {
        throw new Error("Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showAlert("Error uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    const updatedAd = {
      ...ad,
      content: formData.content,
      styles: formData.styles,
    };

    onSave(updatedAd, scheduledTimeState);
    onClose();
  };

  // Convert ad.type to lowercase to be used later
  const adType = ad?.type?.toLowerCase() || "";

  return (
    <Modal isOpen={!!ad} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="!z-[9999] flex h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white dark:bg-black">
          {/* Header */}
          <div className="border-b p-6">
            <h3 className="text-2xl font-bold dark:text-white">
              Edit {adType.charAt(0).toUpperCase() + adType.slice(1)} Ad
            </h3>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <div>
              <label className="mb-1 block text-xl font-bold text-gray-700 dark:text-white">
                Title
              </label>
              <input
                name="title"
                type="text"
                value={formData.content.title}
                onChange={handleInputChange}
                className="w-full rounded-md border p-2 focus:ring-2 focus:ring-orange-500"
                placeholder="Enter title"
              />
            </div>

            <div>
              <label className="mb-1 block text-xl font-bold text-gray-700 dark:text-white">
                Description
              </label>
              <textarea
                name="description"
                value={formData.content.description}
                onChange={handleInputChange}
                className="min-h-24 w-full rounded-md border p-2 focus:ring-2 focus:ring-orange-500"
                placeholder="Enter description"
              />
            </div>

            {/* Text Ad Fields */}
            {adType === "text" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xl font-bold text-gray-700 dark:text-white">
                    Font Family
                  </label>
                  <input
                    name="font"
                    type="text"
                    value={formData.styles.font}
                    onChange={handleStyleChange}
                    className="w-full rounded-md border p-2"
                    placeholder="Font Family (e.g., Arial)"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xl font-bold text-gray-700 dark:text-white">
                    Font Size
                  </label>
                  <input
                    name="fontSize"
                    type="text"
                    value={formData.styles.fontSize}
                    onChange={handleStyleChange}
                    className="w-full rounded-md border p-2"
                    placeholder="Font Size (e.g., 14px)"
                  />
                </div>

                {/* Text Color Picker */}
                <div className="relative">
                  <label className="mb-1 block text-xl font-bold text-gray-700 dark:text-white">
                    Text Color
                  </label>
                  <div
                    onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                    className="flex w-full cursor-pointer items-center space-x-2 rounded-md border p-2"
                  >
                    <div
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: formData.styles.textColor }}
                    />
                    <span>{formData.styles.textColor}</span>
                  </div>
                  {showTextColorPicker && (
                    <div className="absolute z-20">
                      <div
                        className="fixed inset-0"
                        onClick={() => setShowTextColorPicker(false)}
                      />
                      <SketchPicker
                        color={formData.styles.textColor}
                        onChange={(color) =>
                          handleColorChange(color, "textColor")
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Media Upload Fields */}
            {(adType === "image" || adType === "video") && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xl font-bold text-gray-700 dark:text-white">
                    Upload {adType}
                  </label>
                  <input
                    type="file"
                    accept={`${adType}/*`}
                    onChange={handleFileUpload}
                    className="w-full rounded-md border p-2"
                  />
                </div>

                {(file || mediaUrl) && (
                  <div className="mt-4">
                    {adType === "image" ? (
                      <img
                        src={file ? URL.createObjectURL(file) : mediaUrl}
                        alt="Preview"
                        className="h-auto max-w-full rounded-md"
                      />
                    ) : (
                      <video controls className="w-full rounded-md">
                        <source
                          src={file ? URL.createObjectURL(file) : mediaUrl}
                          type={file ? file.type : "video/mp4"}
                        />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Border Color */}
            <div className="relative">
              <label className="mb-1 block text-xl font-bold text-gray-700 dark:text-white">
                Border Color
              </label>
              <div
                onClick={() => setShowBorderColorPicker(!showBorderColorPicker)}
                className="flex w-full cursor-pointer items-center space-x-2 rounded-md border p-2"
              >
                <div
                  className="h-6 w-6 rounded border"
                  style={{ backgroundColor: formData.styles.borderColor }}
                />
                <span>{formData.styles.borderColor}</span>
              </div>
              {showBorderColorPicker && (
                <div className="absolute z-10">
                  <div
                    className="fixed inset-0"
                    onClick={() => setShowBorderColorPicker(false)}
                  />
                  <SketchPicker
                    color={formData.styles.borderColor}
                    onChange={(color) =>
                      handleColorChange(color, "borderColor")
                    }
                  />
                </div>
              )}
            </div>

            {/* Scheduled Time */}
            <div>
              <label className="mb-1 block text-xl font-bold text-gray-700 dark:text-white">
                Scheduled Time
              </label>
              <input
                type="time"
                value={scheduledTimeState}
                onChange={(e) => setScheduledTimeState(e.target.value)}
                className="w-full rounded-md border p-2 focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 p-6">
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="rounded-md border px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <StyledAlert
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </Modal>
  );
};

export default EditModal;
