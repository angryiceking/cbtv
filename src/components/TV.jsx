/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import AFK from './AFK';

const TV = () => {
    const [onlineModels, setOnlineModels] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null); // For pop-up notifications
    const [isMinimized, setIsMinimized] = useState(false); // Minimize state
    const logContainerRef = useRef(null); // Ref for draggable container
    const [containerSize, setContainerSize] = useState({ width: 300, height: 200 }); // Initial size


    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 5000); // Remove notification after 1 second
    };

    const addToActivityLog = (user, status) => {
        setActivityLog((prevLog) => {
            const newLog = [...prevLog, { user, status, timestamp: new Date() }];
            return newLog.slice(-20); // Keep the last 20 logs
        });
    };

    useEffect(() => {
        const logContainer = document.querySelector('.activity-log');
        if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }, [activityLog]);

    // WebSocket Client for Receiving Updates
    useEffect(() => {
        const socket = io('http://localhost:4000');

        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });

        socket.on('initial_data', (data) => {
            if (data.models) {
                setOnlineModels(data.models);
            }
        });

        socket.on('model_update', (newModel) => {
            console.log('model_update: ', newModel)
            if (newModel.name) {
                setOnlineModels((prevModels) => {
                    if (!prevModels.some((model) => model.name === newModel.name)) {
                        addToActivityLog(newModel.name, 'online');
                        showNotification(`${newModel.name} is now online!`)
                        return [
                            ...prevModels,
                            { name: newModel.name, data: newModel, key: `${newModel.name}-${Date.now()}` },
                        ];
                    }
                    return prevModels;
                });
            }
        });

        socket.on('model_remove', (removedModel) => {
            console.log('model_remove: ', removedModel);
            if (removedModel.name) {
                setOnlineModels((prevModels) => prevModels.filter((model) => model.name !== removedModel.name));
                addToActivityLog(removedModel.name, 'offline');
            }
        });

        return () => {
            socket.disconnect(); // Clean up the WebSocket connection on component unmount
        };
    }, []);

    useEffect(() => {
        const logContainer = logContainerRef.current;
        if (!logContainer) return;

        let isDragging = false;
        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        const handleMouseMove = (e) => {
            if (isDragging) {
                logContainer.style.left = `${e.clientX - startX}px`;
                logContainer.style.top = `${e.clientY - startY}px`;
            } else if (isResizing) {
                const newWidth = startWidth + e.clientX - startX;
                const newHeight = startHeight + e.clientY - startY;
                setContainerSize({
                    width: Math.max(200, newWidth),
                    height: Math.max(150, newHeight),
                });
            }
        };

        const handleMouseUp = () => {
            isDragging = false;
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        const handleDragStart = (e) => {
            isDragging = true;
            startX = e.clientX - logContainer.offsetLeft;
            startY = e.clientY - logContainer.offsetTop;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };

        const handleResizeStart = (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = logContainer.offsetWidth;
            startHeight = logContainer.offsetHeight;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };

        const dragHandle = logContainer.querySelector('.drag-handle');
        const resizeHandle = logContainer.querySelector('.resize-handle');

        dragHandle.addEventListener('mousedown', handleDragStart);
        resizeHandle.addEventListener('mousedown', handleResizeStart);

        return () => {
            dragHandle.removeEventListener('mousedown', handleDragStart);
            resizeHandle.removeEventListener('mousedown', handleResizeStart);
        };
    }, []);

    // Dynamically calculate the grid layout based on the number of models
    const getGridStyles = () => {
        const count = onlineModels.length;
        if (count === 1) {
            return { gridTemplateRows: '1fr', gridTemplateColumns: '1fr', height: '100vh' };
        }
        if (count === 2) {
            return { gridTemplateRows: '1fr', gridTemplateColumns: '1fr 1fr', height: '100vh' }; // Split vertically
        }
        if (count <= 4) {
            return { gridTemplateRows: '1fr 1fr', gridTemplateColumns: '1fr 1fr', height: '100vh' };
        }
        if (count <= 6) {
            return { gridTemplateRows: '1fr 1fr 1fr', gridTemplateColumns: '1fr 1fr', height: '100vh' };
        }
        if (count <= 8) {
            return { gridTemplateRows: '1fr 1fr 1fr', gridTemplateColumns: '1fr 1fr 1fr', height: '100vh' };
        }
        return { gridTemplateRows: 'repeat(auto-fit, minmax(1fr, 1fr))', gridTemplateColumns: '1fr 1fr 1fr 1fr', height: '100vh' };
    };

    return (
        <div className="relative min-h-screen">
            {error && <div className="text-center text-red-500 p-4">{error}</div>}
            {notification && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
                    {notification}
                </div>
            )}
            {onlineModels && onlineModels.length !== 0 ? (
                <div
                    className="grid"
                    style={getGridStyles()} // Dynamically apply grid styles
                >
                    {onlineModels.map((model) => (
                        <div
                            key={model.name} // Use the unique key
                            className="flex items-center justify-center relative"
                        >
                            <iframe
                                className="border border-sky-500 rounded"
                                width="100%"
                                height="100%"
                                src={`https://chaturbate.com/fullvideo/?b=${model.name}&campaign=QdzcL&signup_notice=1&tour=Limj&disable_sound=0&quality=240`}
                            />
                            <div className="absolute bottom-0 left-2 bg-white text-black p-4">
                                <h4 className='text-3xl'>{model.name}</h4>
                                <h4 className='text-2xl'>Total Viewers: 19298123</h4>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // <div className="text-center p-4">TV Mode is running in background. Online models will appear here.</div>
                <AFK/>
            )}
            {/* Offline log tracker */}
            <div
                ref={logContainerRef}
                className="activity-log absolute bg-gray-800 text-white rounded shadow-lg"
                style={{
                    top: '4px',
                    right: '4px',
                    width: `${containerSize.width}px`,
                    height: isMinimized ? '30px' : `${containerSize.height}px`,
                }}
            >
                <div className="drag-handle bg-gray-700 text-center text-white cursor-move p-1 rounded-t">
                    <span>Activity Log</span>
                    <button
                        className="float-right bg-red-500 px-2 py-1 text-xs rounded"
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        {isMinimized ? '+' : '-'}
                    </button>
                </div>
                {!isMinimized && (
                    <>
                        <div className="overflow-y-auto" style={{ height: 'calc(100% - 30px)' }}>
                            {activityLog.length > 0 ? (
                                activityLog.map((log, index) => (
                                    <div key={index} className="text-sm border-b border-gray-600 py-1">
                                        <span
                                            className={`font-semibold ${
                                                log.status === 'online' ? 'text-green-400' : 'text-red-400'
                                            }`}
                                        >
                                            {log.user}
                                        </span>{' '}
                                        {log.status === 'online' ? 'came online' : 'went offline'} at{' '}
                                        {log.timestamp.toLocaleTimeString()}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400 pt-5 pl-5">No activity yet.</p>
                            )}
                        </div>
                        <div className="resize-handle w-4 h-4 bg-gray-500 cursor-se-resize absolute bottom-0 right-0"></div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TV;
