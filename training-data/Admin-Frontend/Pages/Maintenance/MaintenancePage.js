// AdminFE/Pages/Maintenance/MaintenancePage.js
import React from 'react';
import './MaintenancePage.css';

const MaintenancePage = () => {
    return (
        <div className="maintenance-container">
            <div className="maintenance-content">
                <svg className="maintenance-icon" xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
                <h1>Hệ thống đang bảo trì</h1>
            </div>
        </div>
    );
};

export default MaintenancePage;