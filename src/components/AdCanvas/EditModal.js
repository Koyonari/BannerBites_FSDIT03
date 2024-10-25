// EditModal.js
import React, { useEffect, useState } from 'react';
import { SketchPicker } from 'react-color';
import Modal from '../Modal/Modal.js'; // Ensure you have a Modal component or replace this with your modal implementation

const EditModal = ({ ad, scheduledDateTime, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    content: {
      title: '',
      description: '',
      s3Bucket: '', // Add this
      s3Key: '',    // Add this
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
    const file = e.target.files[0];
    if (!file) return;
  
    try {
      const s3Key = `media/${Date.now()}-${file.name}`;
      await Storage.put(s3Key, file, {
        contentType: file.type,
      });
  
      setFormData((prevData) => ({
        ...prevData,
        content: {
          ...prevData.content,
          s3Bucket: awsConfig.Storage.AWSS3.bucket,
          s3Key: s3Key,
        },
      }));
  
      alert('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
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
          <input type="file" accept={ad.type + '/*'} onChange={handleFileUpload} />
          {file && (
            <div>
              {ad.type === 'image' ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  style={{ maxWidth: '100%', marginTop: '10px' }}
                />
              ) : (
                <video controls style={{ width: '100%', marginTop: '10px' }}>
                  <source src={URL.createObjectURL(file)} type={file.type} />
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
      <label>
        Scheduled Date and Time:
        <input
          type="datetime-local"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
        />
      </label>
  
      <button onClick={handleSave}>Save</button>
      <button onClick={onClose}>Cancel</button>
    </Modal>
  );
};

export default EditModal;
