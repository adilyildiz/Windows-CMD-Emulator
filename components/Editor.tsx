import React, { useState } from 'react';

interface EditorProps {
  filePath: string;
  initialContent: string;
  onSave: (path: string, content: string) => void;
  onCancel: () => void;
}

export const Editor: React.FC<EditorProps> = ({ filePath, initialContent, onSave, onCancel }) => {
  const [content, setContent] = useState(initialContent);

  const handleSave = () => {
    onSave(filePath, content);
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col p-4 z-10">
      <div className="bg-[#012456] text-white p-2 flex justify-between items-center">
        <span>CMD Editor - {filePath}</span>
        <div>
          <button onClick={handleSave} className="bg-gray-600 hover:bg-gray-500 px-3 py-1 mx-1">Save</button>
          <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 px-3 py-1 mx-1">Cancel</button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-grow bg-[#1e1e1e] text-gray-300 font-mono outline-none p-2 resize-none"
        spellCheck="false"
        autoFocus
      />
    </div>
  );
};
