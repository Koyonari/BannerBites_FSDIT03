// EditModal.js
import React, { useEffect, useState } from 'react';
import { SketchPicker } from 'react-color';
import Modal from '../Modal/Modal.js';
import axios from 'axios'; // Import Axios for HTTP requests

const EditModal = ({ ad, scheduledDateTime, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    content: {
      title: '',
      description: '',
      s3Bucket: '',
      s3Key: '',
    },
    styles: {
      font: 'Arial',
      fontSize: '14px',
      textColor: '#000000',
      borderColor: '#000000',
    },
  });
  const [scheduledTime, setScheduledTime] = useState(
    scheduledDateTime || new Date().toISOString().slice(0, 16)
  );
  const [file, setFile] = useState(null); // For new uploads
  const [mediaUrl, setMediaUrl] = useState(''); // For existing media
  const [uploading, setUploading] = useState(false); // To indicate upload status

  useEffect(() => {
    if (ad && ad.content) {
      setFormData({
        content: {
          title: ad.content.title || '',
          description: ad.content.description || '',
          s3Bucket: ad.content.s3Bucket || '',
          s3Key: ad.content.s3Key || '',
        },
        styles: ad.styles || {
          font: 'Arial',
          fontSize: '14px',
          textColor: '#000000',
          borderColor: '#000000',
        },
      });

      // If editing an existing media ad, fetch the media URL for preview
      if ((ad.type === 'image' || ad.type === 'video') && ad.content.s3Key) {
        const s3Bucket = ad.content.s3Bucket;
        const s3Key = ad.content.s3Key;
        const s3Region = process.env.REACT_APP_AWS_REGION; // Ensure this is set in your frontend's .env

        if (s3Bucket && s3Key && s3Region) {
          const url = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${s3Key}`;
          setMediaUrl(url);
        }
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

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const getPresignedUrl = async (file) => {
    try {
      const response = await axios.get('http://localhost:5000/api/uploadMediaUrl', {
        params: {
          fileName: file.name,
          fileType: file.type,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting pre-signed URL:', error);
      throw error;
    }
  };

  const uploadFileToS3 = async (uploadURL, file) => {
    try {
      await axios.put(uploadURL, file, {
        headers: {
          'Content-Type': file.type,
        },
      });
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert('No file selected for upload.');
      return;
    }

    setUploading(true);

    try {
      // Step 1: Get pre-signed URL from backend
      const { uploadURL, fileKey } = await getPresignedUrl(file);

      // Step 2: Upload the file to S3 using the pre-signed URL
      await uploadFileToS3(uploadURL, file);

      // Step 3: Update formData with S3 details
      const s3Bucket = process.env.REACT_APP_S3_BUCKET_NAME; // Ensure this is set in your frontend's .env
      const s3Region = process.env.REACT_APP_AWS_REGION; // Ensure this is set in your frontend's .env
      const s3Url = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${fileKey}`;

      setFormData((prevData) => ({
        ...prevData,
        content: {
          ...prevData.content,
          s3Bucket: s3Bucket,
          s3Key: fileKey,
        },
      }));

      setMediaUrl(s3Url); // Update the media URL for preview
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Error during file upload:', error);
      alert('Failed to upload file.');
    } finally {
      setUploading(false);
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

      {ad.type === 'text' && (
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
            onChange={(color) => handleColorChange(color, 'textColor')}
          />
        </>
      )}

      {(ad.type === 'image' || ad.type === 'video') && (
        <>
          {/* Media ad-specific fields */}
          <input
            type="file"
            accept={ad.type + '/*'}
            onChange={handleFileChange}
          />
          <button onClick={handleFileUpload} disabled={uploading || !file}>
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>

          {/* Existing Media Preview */}
          {mediaUrl && (
            <div style={{ marginTop: '10px' }}>
              {ad.type === 'image' ? (
                <img
                  src={mediaUrl}
                  alt="Existing Media"
                  style={{ maxWidth: '100%' }}
                />
              ) : (
                <video controls style={{ width: '100%' }}>
                  <source src={mediaUrl} type={file ? file.type : 'video/mp4'} />
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
        onChange={(color) => handleColorChange(color, 'borderColor')}
      />

      {/* Scheduled time input */}
      <label style={{ display: 'block', marginTop: '10px' }}>
        Scheduled Date and Time:
        <input
          type="datetime-local"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          style={{ display: 'block', marginTop: '5px' }}
        />
      </label>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleSave} style={{ marginRight: '10px' }}>
          Save
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
};

export default EditModal;
