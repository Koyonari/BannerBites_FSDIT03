import React, { useEffect, useState } from "react";
import { SketchPicker } from "react-color";
import Modal from "../Modal/Modal";

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
    scheduledTime || "00:00"
  );
  const [file, setFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [showBorderColorPicker, setShowBorderColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching pre-signed URL:", errorData);
        alert("Failed to get pre-signed URL");
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
      alert("Error uploading file");
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
      <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg w-full max-w-2xl flex flex-col max-h-screen">
          {/* Header */}
          <div className="p-6 border-b">
            <h3 className="text-2xl font-semibold">
              Edit {adType.charAt(0).toUpperCase() + adType.slice(1)} Ad
            </h3>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                name="title"
                type="text"
                value={formData.content.title}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-500"
                placeholder="Enter title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.content.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-500 min-h-24"
                placeholder="Enter description"
              />
            </div>

            {/* Text Ad Fields */}
            {adType === "text" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Family
                  </label>
                  <input
                    name="font"
                    type="text"
                    value={formData.styles.font}
                    onChange={handleStyleChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Font Family (e.g., Arial)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Size
                  </label>
                  <input
                    name="fontSize"
                    type="text"
                    value={formData.styles.fontSize}
                    onChange={handleStyleChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Font Size (e.g., 14px)"
                  />
                </div>

                {/* Text Color Picker */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Color
                  </label>
                  <div
                    onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                    className="w-full p-2 border rounded-md flex items-center space-x-2 cursor-pointer"
                  >
                    <div
                      className="w-6 h-6 rounded border"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload {adType}
                  </label>
                  <input
                    type="file"
                    accept={`${adType}/*`}
                    onChange={handleFileUpload}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {(file || mediaUrl) && (
                  <div className="mt-4">
                    {adType === "image" ? (
                      <img
                        src={file ? URL.createObjectURL(file) : mediaUrl}
                        alt="Preview"
                        className="max-w-full h-auto rounded-md"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Border Color
              </label>
              <div
                onClick={() => setShowBorderColorPicker(!showBorderColorPicker)}
                className="w-full p-2 border rounded-md flex items-center space-x-2 cursor-pointer"
              >
                <div
                  className="w-6 h-6 rounded border"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Time
              </label>
              <input
                type="time"
                value={scheduledTimeState}
                onChange={(e) => setScheduledTimeState(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditModal;
