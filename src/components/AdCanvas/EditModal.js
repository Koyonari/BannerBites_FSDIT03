import React, { useState } from 'react';

const EditModal = ({ ad, onSave, onClose }) => {
  const [formData, setFormData] = useState(ad.content);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileUpload = (e) => {
    const file = URL.createObjectURL(e.target.files[0]);
    setFormData({ ...formData, src: file });
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal">
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
        </>
      )}

      {(ad.type === 'image' || ad.type === 'video') && (
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
        </>
      )}

      {ad.type === 'clickable' && (
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
        </>
      )}

      <button onClick={handleSubmit}>Save</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default EditModal;
