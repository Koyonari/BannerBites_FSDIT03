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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-opacity-50 p-4">
        <div className="relative h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border-light bg-base-white shadow-xl dark:border-border-dark dark:bg-bg-dark">
          {/* Header */}
          <div className="border-b border-border-light p-6 dark:border-border-dark">
            <h2 className="text-2xl font-bold text-text-light dark:text-base-white">
              Edit {adType.charAt(0).toUpperCase() + adType.slice(1)} Ad
            </h2>
          </div>

          {/* Content */}
          <div className="flex h-[calc(100%-8rem)] flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mx-auto grid max-w-5xl gap-6">
                {/* Title */}
                <div className="group relative">
                  <input
                    name="title"
                    type="text"
                    value={formData.content.title}
                    onChange={handleInputChange}
                    className="peer h-14 w-full rounded-lg border border-border-light bg-transparent px-4 text-text-light outline-none transition-all duration-300 placeholder:text-transparent focus:border-bg-accent focus:ring-2 focus:ring-ring-primary/20 dark:border-border-dark dark:text-text-dark"
                    placeholder="Title"
                  />
                  <label className="absolute left-4 top-1/2 z-10 origin-[0] -translate-y-1/2 transform text-text-sublight transition-all duration-300 peer-focus:-translate-y-8 peer-focus:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-8 peer-[:not(:placeholder-shown)]:scale-75 dark:text-text-subdark">
                    Title
                  </label>
                </div>

                {/* Description and Colors Section */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Description */}
                  <div className="group relative">
                    <textarea
                      name="description"
                      value={formData.content.description}
                      onChange={handleInputChange}
                      className="peer h-40 w-full resize-none rounded-lg border border-border-light bg-transparent p-4 text-text-light outline-none transition-all duration-300 placeholder:text-transparent focus:border-bg-accent focus:ring-2 focus:ring-ring-primary/20 dark:border-border-dark dark:text-text-dark"
                      placeholder="Description"
                    />
                    <label className="absolute left-4 top-4 z-10 origin-[0] transform text-text-sublight transition-all duration-300 peer-focus:-translate-y-8 peer-focus:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-8 peer-[:not(:placeholder-shown)]:scale-75 dark:text-text-subdark">
                      Description
                    </label>
                  </div>

                  {/* Colors */}
                  <div className="space-y-6">
                    {isTextBased && (
                      <div className="relative">
                        <label className="mb-2 block text-sm font-medium text-text-sublight dark:text-text-subdark">
                          Text Color
                        </label>
                        <div
                          onClick={() =>
                            setShowTextColorPicker(!showTextColorPicker)
                          }
                          className="flex h-14 w-full cursor-pointer items-center space-x-2 rounded-lg border border-border-light p-4 text-text-light transition-all hover:border-bg-accent dark:border-border-dark dark:text-text-dark"
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
                      <label className="mb-2 block text-sm font-medium text-text-sublight dark:text-text-subdark">
                        Border Color
                      </label>
                      <div
                        onClick={() =>
                          setShowBorderColorPicker(!showBorderColorPicker)
                        }
                        className="flex h-14 w-full cursor-pointer items-center space-x-2 rounded-lg border border-border-light p-4 text-text-light transition-all hover:border-bg-accent dark:border-border-dark dark:text-text-dark"
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
                        <div className="absolute z-20">
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
                    <div className="group relative">
                      <input
                        name="font"
                        type="text"
                        value={formData.styles.font}
                        onChange={handleStyleChange}
                        className="peer h-14 w-full rounded-lg border border-border-light bg-transparent px-4 text-text-light outline-none transition-all duration-300 placeholder:text-transparent focus:border-bg-accent focus:ring-2 focus:ring-ring-primary/20 dark:border-border-dark dark:text-text-dark"
                        placeholder="Font Family"
                      />
                      <label className="absolute left-4 top-1/2 z-10 origin-[0] -translate-y-1/2 transform text-text-sublight transition-all duration-300 peer-focus:-translate-y-8 peer-focus:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-8 peer-[:not(:placeholder-shown)]:scale-75 dark:text-text-subdark">
                        Font Family
                      </label>
                    </div>

                    <div className="group relative">
                      <input
                        name="fontSize"
                        type="text"
                        value={formData.styles.fontSize}
                        onChange={handleStyleChange}
                        className="peer h-14 w-full rounded-lg border border-border-light bg-transparent px-4 text-text-light outline-none transition-all duration-300 placeholder:text-transparent focus:border-bg-accent focus:ring-2 focus:ring-ring-primary/20 dark:border-border-dark dark:text-text-dark"
                        placeholder="Font Size"
                      />
                      <label className="absolute left-4 top-1/2 z-10 origin-[0] -translate-y-1/2 transform text-text-sublight transition-all duration-300 peer-focus:-translate-y-8 peer-focus:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-8 peer-[:not(:placeholder-shown)]:scale-75 dark:text-text-subdark">
                        Font Size
                      </label>
                    </div>
                  </div>
                )}

                {/* Scheduled Time */}
                <div className="group relative">
                  <input
                    type="time"
                    value={scheduledTimeState}
                    onChange={(e) => setScheduledTimeState(e.target.value)}
                    className="peer h-14 w-full rounded-lg border border-border-light bg-transparent px-4 text-text-light outline-none transition-all duration-300 placeholder:text-transparent focus:border-bg-accent focus:ring-2 focus:ring-ring-primary/20 dark:border-border-dark dark:text-text-dark"
                  />
                  <label className="absolute left-4 top-1/2 z-10 origin-[0] -translate-y-1/2 transform text-text-sublight transition-all duration-300 peer-focus:-translate-y-8 peer-focus:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-8 peer-[:not(:placeholder-shown)]:scale-75 dark:text-text-subdark">
                    Scheduled Time
                  </label>
                </div>

                {/* Media Upload Section */}
                {(adType === "image" || adType === "video") && (
                  <div className="w-full space-y-4">
                    <div>
                      <label className="blocktext-xl mb-1 neutral-text dark:secondary-text">
                        Upload {adType}
                      </label>
                      <input
                        type="file"
                        accept={`${adType}/*`}
                        onChange={handleFileUpload}
                        className="w-full rounded-md border border-border-light p-2 primary-text dark:border-border-dark dark:secondary-text"
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
            <div className="border-t border-border-light bg-base-white p-6 pb-0 dark:border-border-dark dark:bg-bg-dark">
              <div className="mx-auto flex max-w-5xl justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-border-light px-6 py-2 text-text-light transition-all hover:bg-gray-50 dark:border-border-dark dark:text-text-dark dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUploading}
                  className="rounded-lg bg-bg-accent px-6 py-2 font-semibold text-base-white shadow-lg shadow-bg-accent/20 transition-all hover:bg-bg-subaccent focus:ring-2 focus:ring-ring-primary focus:ring-offset-2 disabled:opacity-50 dark:shadow-bg-accent/20"
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
