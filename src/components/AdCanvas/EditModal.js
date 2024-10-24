import React, { useEffect, useState } from 'react';
import { SketchPicker } from 'react-color';
import Modal from '../Modal/Modal.js'; // Import the Modal component

const EditModal = ({ ad, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    src: '',
    styles: {
      font: 'Arial',
      fontSize: '14px',
      textColor: '#000000',
      borderColor: '#000000',
    },
  });

  useEffect(() => {
    if (ad && ad.content) {
      // Correctly set formData without splitting the title
      setFormData({
        ...ad.content,
        styles: ad.styles || formData.styles,
        title: ad.content?.title || '', // Preserve the title as a whole string
      });
    }
  }, [ad, formData.styles]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleStyleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      styles: {
        ...formData.styles,
        [name]: value,
      },
    });
  };

  const handleColorChange = (color, field) => {
    setFormData({
      ...formData,
      styles: {
        ...formData.styles,
        [field]: color.hex,
      },
    });
  };

  const handleFileUpload = (e) => {
    const file = URL.createObjectURL(e.target.files[0]);
    setFormData({ ...formData, src: file });
  };

  const handleSubmit = () => {
    // Save the form data correctly without breaking content into characters
    onSave({
      ...formData,
      title: formData.title, // Ensure title remains a string
    });
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
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Title"
          />
          <textarea
            name="description"
            value={formData.description}
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
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Title"
          />
          <input
            name="description"
            type="text"
            value={formData.description}
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

      <button onClick={handleSubmit}>Save</button>
      <button onClick={onClose}>Cancel</button>
    </Modal>
  );
};

export default EditModal;
