'use client';

import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

export default function Settings({ shapes, setShapes, theme, setTheme, autoSave, setAutoSave }) {
  const [newShape, setNewShape] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const storedShapes = localStorage.getItem('userShapes');
    if (storedShapes) {
      const userShapes = JSON.parse(storedShapes);
      setShapes([...new Set([...shapes, ...userShapes])]);
    }
  }, []);

  const addShape = () => {
    if (!newShape.trim()) {
      setError('Please enter a Shape username.');
      return;
    }
    const normalizedShape = newShape.trim().replace(/^shapesinc\//, '');
    if (shapes.includes(normalizedShape)) {
      setError('Shape already exists.');
      return;
    }
    const updatedShapes = [...shapes, normalizedShape];
    setShapes(updatedShapes);
    localStorage.setItem(
      'userShapes',
      JSON.stringify(updatedShapes.filter(s => !process.env.NEXT_PUBLIC_SHAPES_USERNAMES?.split(',').includes(s)))
    );
    setNewShape('');
    setError('');
  };

  const removeShape = shape => {
    if (process.env.NEXT_PUBLIC_SHAPES_USERNAMES?.split(',').includes(shape)) {
      setError('Cannot remove default Shapes.');
      return;
    }
    const updatedShapes = shapes.filter(s => s !== shape);
    setShapes(updatedShapes);
    localStorage.setItem(
      'userShapes',
      JSON.stringify(updatedShapes.filter(s => !process.env.NEXT_PUBLIC_SHAPES_USERNAMES?.split(',').includes(s)))
    );
    setError('');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = newTheme;
  };

  const toggleAutoSave = () => {
    const newAutoSave = !autoSave;
    setAutoSave(newAutoSave);
    localStorage.setItem('autoSave', JSON.stringify(newAutoSave));
  };

  return (
    <div className="settings-panel">
      <h2>Settings</h2>
      <div className="theme-toggle">
        <label>Theme: </label>
        <button onClick={toggleTheme}>{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</button>
      </div>
      <div className="auto-save-toggle">
        <label>Auto-Save Conversations: </label>
        <button onClick={toggleAutoSave}>{autoSave ? 'Disable' : 'Enable'}</button>
      </div>
      <div className="shape-input">
        <input
          type="text"
          value={newShape}
          onChange={e => setNewShape(e.target.value)}
          placeholder="Enter Shape username (e.g., myShape)"
          onKeyPress={e => e.key === 'Enter' && addShape()}
        />
        <button onClick={addShape}>Add Shape</button>
      </div>
      {error && <div className="error-message">{error}</div>}
      <h3>Available Shapes</h3>
      <ul>
        {shapes.map(shape => (
          <li key={shape}>
            {shape}
            {!process.env.NEXT_PUBLIC_SHAPES_USERNAMES?.split(',').includes(shape) && (
              <button onClick={() => removeShape(shape)} className="remove-shape">
                <FaTimes />
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="settings-note">
        <p>
          <strong>Note:</strong> Premium Shapes may consume credits when used via the API. Check{' '}
          <a href="https://shapes.inc" target="_blank" rel="noopener noreferrer">
            shapes.inc
          </a>{' '}
          for details.
        </p>
      </div>
    </div>
  );
    }
