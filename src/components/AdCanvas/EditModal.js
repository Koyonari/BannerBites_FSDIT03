// EditModal.js
import React, { useEffect, useState } from "react";
import { SketchPicker } from "react-color";
import Modal from "../Modal/Modal.js";

const EditModal = ({ ad, scheduledDateTime, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    content: {
      title: "",
      description: "",
      s3Bucket: "",
      s3Key: "",
    },
    styles: {
      font: "Arial",
      fontSize: "14px",
      textColor: "#000000",
      borderColor: "#000000",
    },
  });
  const [scheduledTime, setScheduledTime] = useState(
    scheduledDateTime || new Date().toISOString().slice(0, 16)
  );
  const [file, setFile] = useState(null); // For new uploads
  const [mediaUrl, setMediaUrl] = useState(""); // For existing media

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
          src: ad.content.src || mediaUrl || "", // Include src
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

    try {
      // Request pre-signed URL from backend
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
        const errorData = await response.json(); // Only read the response once here
        console.error("Error fetching pre-signed URL:", errorData);
        alert("Failed to get pre-signed URL");
        return;
      }

      const { url, key } = await response.json(); // Parse the JSON response only once
      console.log("Pre-signed URL received:", url);

      // Use the pre-signed URL to upload the file
      const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type,
        },
        body: selectedFile,
      });

      if (uploadResponse.ok) {
        console.log("File uploaded successfully");
        const mediaUrlWithoutParams = url.split("?")[0];
        setFormData((prevData) => ({
          ...prevData,
          content: {
            ...prevData.content,
            s3Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
            s3Key: key,
            src: mediaUrlWithoutParams, // Set src to the uploaded file URL
          },
        }));
        setMediaUrl(mediaUrlWithoutParams); // Get media URL without query params
      } else {
        console.error("Failed to upload file:", uploadResponse.statusText);
        alert("Error uploading file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
    }
  };

  const handleSave = () => {
    // Construct the ad object
    const updatedAd = {
      ...ad,
      content: {
        ...formData.content,
      },
      styles: {
        ...formData.styles,
      },
    };

    // Pass the updated ad data and scheduled time back to the parent component
    onSave(updatedAd, scheduledTime);
    onClose();
  };

  return (
    <Modal isOpen={!!ad} onClose={onClose}>
      <h3>Edit {ad.type} Ad</h3>

      <input
        name="title"
        type="text"
        value={formData.content.title}
        onChange={handleInputChange}
        placeholder="Title"
      />
      <textarea
        name="description"
        value={formData.content.description}
        onChange={handleInputChange}
        placeholder="Description"
      />

      {ad.type === "text" && (
        <>
          {/* Text ad-specific fields */}
          <input
            name="font"
            type="text"
            value={formData.styles.font}
            onChange={handleStyleChange}
            placeholder="Font Family (e.g., Arial)"
          />
          <input
            name="fontSize"
            type="text"
            value={formData.styles.fontSize}
            onChange={handleStyleChange}
            placeholder="Font Size (e.g., 14px)"
          />
          <label>Text Color:</label>
          <SketchPicker
            color={formData.styles.textColor}
            onChange={(color) => handleColorChange(color, "textColor")}
          />
        </>
      )}

      {(ad.type === "image" || ad.type === "video") && (
        <>
          {/* Media ad-specific fields */}
          <input
            type="file"
            accept={ad.type + "/*"}
            onChange={handleFileUpload}
          />

          {/* Existing Media Preview or new file */}
          {(file || mediaUrl) && (
            <div style={{ marginTop: "10px" }}>
              {ad.type === "image" ? (
                <img
                  src={file ? URL.createObjectURL(file) : mediaUrl}
                  alt="Preview"
                  style={{ maxWidth: "100%" }}
                />
              ) : (
                <video controls style={{ width: "100%" }}>
                  <source
                    src={file ? URL.createObjectURL(file) : mediaUrl}
                    type={file ? file.type : "video/mp4"}
                  />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
        </>
      )}

      {/* Common fields */}
      <label>Border Color:</label>
      <SketchPicker
        color={formData.styles.borderColor}
        onChange={(color) => handleColorChange(color, "borderColor")}
      />

      {/* Scheduled time input */}
      <label style={{ display: "block", marginTop: "10px" }}>
        Scheduled Date and Time:
        <input
          type="datetime-local"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          style={{ display: "block", marginTop: "5px" }}
        />
      </label>

      <div style={{ marginTop: "20px" }}>
        <button onClick={handleSave} style={{ marginRight: "10px" }}>
          Save
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
};

export default EditModal;
