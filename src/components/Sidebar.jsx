import React from 'react';
import './Sidebar.css';

function Sidebar({ isOpen, onToggle, children }) {
  return (
    <>
      <button className="sidebar-toggle" onClick={onToggle} title={isOpen ? "Hide sidebar" : "Show sidebar"}>
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        )}
      </button>

      <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        {children}
      </div>
    </>
  );
}

export default Sidebar;
