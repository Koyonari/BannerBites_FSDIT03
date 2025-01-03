import React, { useEffect, useState } from "react";
import { SketchPicker } from "react-color";
import Modal from "../Modal/Modal";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import StyledAlert from "../StyledAlert";

// EditModal is a modal popup that allows users to edit an ad
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

  // useEffect hook to update the form data when the ad prop changes
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
      // Set mediaUrl state if it exists
      if (mediaUrl) {
        setMediaUrl(mediaUrl);
      }
      // Set scheduledTimeState if ad.scheduledTime exists
      if (ad.scheduledTime) {
        setScheduledTimeState(ad.scheduledTime);
      } else if (scheduledTime) {
        setScheduledTimeState(scheduledTime);
      }
    }
  }, [ad, scheduledTime]);

  // Function to handle input change
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

  // Function to handle style change
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

  // Function to handle color change
  const handleColorChange = (color, field) => {
    setFormData((prevData) => ({
      ...prevData,
      styles: {
        ...prevData.styles,
        [field]: color.hex,
      },
    }));
  };

  // Function to handle file upload
  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsUploading(true);

    try {
      // Request the pre-signed URL from the server
      const response = await axios.post(
        "http://localhost:5000/generate-presigned-url",
        {
          fileName: selectedFile.name,
          contentType: selectedFile.type,
        },
      );

      const { url, key } = response.data;

      // Upload the file to S3 using the pre-signed URL
      await axios.put(url, selectedFile, {
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      // Set the form data and media URL
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
    } catch (error) {
      console.error("Error uploading file:", error);
      showAlert("Error uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    const isNewAd = ad.id && ad.id.startsWith("sidebar-");
    // Check if all required fields are filled
    const updatedAd = {
      ...ad,
      content: formData.content,
      styles: formData.styles,
      id: isNewAd ? uuidv4() : ad.id, // Assign new UUID if ad.id is a placeholder
    };

    onSave(updatedAd, scheduledTimeState);
    onClose();
  };

  // Convert ad.type to lowercase to be used later
  const adType = ad?.type?.toLowerCase() || "";
  const isTextBased = adType !== "image" && adType !== "video";

  return (
    <Modal isOpen={!!ad} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-opacity-50 p-4 dark-bg">
        <div className="!z-[9999] flex h-[80vh] w-full max-w-2xl flex-col rounded-lg border light-bg dark:white-border dark:dark-bg">
          {/* Header */}
          <div className="border-b p-6">
            <h3 className="text-2xl font-bold dark:secondary-text">
              Edit {adType.charAt(0).toUpperCase() + adType.slice(1)} Ad
            </h3>
          </div>

          {/* Content */}
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mx-auto grid max-w-5xl gap-6">
                {/* Title */}
                <div>
                  <label className="neutral-text mb-2 block text-xl dark:secondary-text">
                    Title
                  </label>
                  <input
                    name="title"
                    type="text"
                    value={formData.content.title}
                    onChange={handleInputChange}
                    className="neutral-text h-12 w-full rounded-md border p-3"
                    placeholder="Enter title"
                  />
                </div>

                {/* Description and Colors Section */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Description */}
                  <div>
                    <label className="neutral-text mb-2 block text-xl dark:secondary-text">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.content.description}
                      onChange={handleInputChange}
                      className="h-40 w-full resize-none rounded-md border p-3"
                      placeholder="Enter description"
                    />
                  </div>

                  {/* Colors */}
                  <div className="space-y-6">
                    {isTextBased && (
                      <div className="relative">
                        <label className="neutral-text mb-2 block text-xl dark:secondary-text">
                          Text Color
                        </label>
                        <div
                          onClick={() =>
                            setShowTextColorPicker(!showTextColorPicker)
                          }
                          className="flex h-12 w-full cursor-pointer items-center space-x-2 rounded-md border p-3"
                        >
                          <div
                            className="h-6 w-6 rounded border"
                            style={{
                              backgroundColor: formData.styles.textColor,
                            }}
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
                    )}

                    <div className="relative">
                      <label className="neutral-text mb-2 block text-xl dark:secondary-text">
                        Border Color
                      </label>
                      <div
                        onClick={() =>
                          setShowBorderColorPicker(!showBorderColorPicker)
                        }
                        className="flex h-12 w-full cursor-pointer items-center space-x-2 rounded-md border p-3"
                      >
                        <div
                          className="h-6 w-6 rounded border"
                          style={{
                            backgroundColor: formData.styles.borderColor,
                          }}
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
                  </div>
                </div>

                {/* Font Settings */}
                {isTextBased && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="neutral-text mb-2 block text-xl dark:secondary-text">
                        Font Family
                      </label>
                      <input
                        name="font"
                        type="text"
                        value={formData.styles.font}
                        onChange={handleStyleChange}
                        className="h-12 w-full rounded-md border p-3"
                        placeholder="Font Family (e.g., Arial)"
                      />
                    </div>

                    <div>
                      <label className="neutral-text mb-2 block text-xl dark:secondary-text">
                        Font Size
                      </label>
                      <input
                        name="fontSize"
                        type="text"
                        value={formData.styles.fontSize}
                        onChange={handleStyleChange}
                        className="h-12 w-full rounded-md border p-3"
                        placeholder="Font Size (e.g., 14px)"
                      />
                    </div>
                  </div>
                )}

                {/* Scheduled Time */}
                <div>
                  <label className="neutral-text mb-2 block text-xl dark:secondary-text">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTimeState}
                    onChange={(e) => setScheduledTimeState(e.target.value)}
                    className="h-12 w-full rounded-md border p-3"
                  />
                </div>

                {/* Media Upload Section */}
                {(adType === "image" || adType === "video") && (
                  <div className="w-full space-y-4">
                    <div>
                      <label className="neutral-text mb-1 block text-xl dark:secondary-text">
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
              </div>
            </div>

            {/* Footer */}
            <div className="neutralalt-bg border-t p-6 dark:dark-bg">
              <div className="mx-auto flex max-w-5xl justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="hover:neutralalt-bg rounded-md border px-6 py-2 dark:light-bg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="primary-bg hover:secondary-bg rounded-md px-6 py-2 secondary-text"
                  disabled={isUploading}
                >
                  Save Changes
                </button>
              </div>
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
