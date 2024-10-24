// EditModal.js
import React, { useEffect, useState } from 'react';
import { SketchPicker } from 'react-color';
import Modal from '../Modal/Modal.js'; // Ensure you have a Modal component or replace this with your modal implementation

const EditModal = ({ ad, scheduledDateTime, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    content: {
      title: '',
      description: '',
      src: '',
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
          src: ad.content.src || '',
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

  const handleFileUpload = (e) => {
    const file = URL.createObjectURL(e.target.files[0]);
    setFormData((prevData) => ({
      ...prevData,
      content: {
        ...prevData.content,
        src: file,
      },
    }));
  };

  const handleSave = () => {
    // Pass the updated ad data and scheduled time back to the parent component
    onSave(formData, scheduledTime);
    onClose();
  };

  return (
    <Modal isOpen={!!ad} onClose={onClose}>
      <h3>Edit {ad.type} Ad</h3>

      {ad.type === 'text' && (
        <>
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
          <label>Border Color:</label>
          <SketchPicker
            color={formData.styles.borderColor}
            onChange={(color) => handleColorChange(color, 'borderColor')}
          />
        </>
      )}

      {(ad.type === 'image' || ad.type === 'video' || ad.type === 'clickable') && (
        <>
          <input
            name="title"
            type="text"
            value={formData.content.title}
            onChange={handleInputChange}
            placeholder="Title"
          />
          <input
            name="description"
            type="text"
            value={formData.content.description}
            onChange={handleInputChange}
            placeholder="Description"
          />
          <input type="file" onChange={handleFileUpload} />
          <label>Border Color:</label>
          <SketchPicker
            color={formData.styles.borderColor}
            onChange={(color) => handleColorChange(color, 'borderColor')}
          />
        </>
      )}

      {/* Add scheduled time input */}
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
