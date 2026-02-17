import React from 'react';

const SensorCard = ({ name, value, unit, status }) => {
    // Determine color class based on status
    const getStatusClass = (status) => {
        switch (status) {
            case 'warning': return 'status-warning';
            case 'danger': return 'status-danger';
            default: return 'status-safe';
        }
    };

    const statusClass = getStatusClass(status);
    const textClass = `text-${status === 'safe' ? 'safe' : status}`;

    return (
        <div className="sensor-card">
            <div className="card-header">
                <span className="sensor-name">{name}</span>
                <span className={`status-indicator ${statusClass}`}>
                    {status === 'safe' ? 'Normal' : status === 'danger' ? 'Alert' : 'Warning'}
                </span>
            </div>

            <div className="sensor-value-container">
                <span className={`sensor-value ${textClass}`}>
                    {value}
                </span>
                <span className="sensor-unit">{unit}</span>
            </div>

            {/* Decorative background element/graph placeholder could go here */}
            <div style={{
                position: 'absolute',
                bottom: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: status === 'danger' ? 'var(--danger-color)' : status === 'warning' ? 'var(--warning-color)' : 'var(--safe-color)',
                filter: 'blur(50px)',
                opacity: 0.2,
                borderRadius: '50%',
                zIndex: -1
            }} />
        </div>
    );
};

export default SensorCard;
