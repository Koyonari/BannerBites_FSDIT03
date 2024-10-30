// SaveLayoutModal.js
import React, { useState } from 'react';
import Modal from '../Modal/Modal'; // Adjust the import path based on your project structure

const SaveLayoutModal = ({ onSave, onClose }) => {
  const [layoutName, setLayoutName] = useState("");

  const handleSave = () => {
    if (layoutName.trim() === "") {
      alert("Please enter a name for the layout.");
      return;
    }
    onSave(layoutName);
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <h3>Save Layout</h3>
      <input
        type="text"
        value={layoutName}
        onChange={(e) => setLayoutName(e.target.value)}
        placeholder="Enter layout name"
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />
      <div style={{ textAlign: 'right' }}>
        <button onClick={handleSave} style={{ marginRight: '10px' }}>
          Save
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
};

export default SaveLayoutModal;
