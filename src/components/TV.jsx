/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { fetchData } from '../api/client';
import tastyModels from '../api/tasty_models.json';

const TV = () => {
    const [onlineModels, setOnlineModels] = useState([]);
    const [offlineLog, setOfflineLog] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null); // For pop-up notifications
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 1000); // Remove notification after 1 second
    };

    const logOfflineUser = (user) => {
        setOfflineLog((prevLog) => {
            const newLog = [...prevLog, { user, timestamp: new Date() }];
            return newLog.slice(-10); // Keep the last 10 logs
        });
    };

    useEffect(() => {
        const logContainer = document.querySelector('.offline-log');
        if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }, [offlineLog]);

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
                    // Avoid duplicates
                    if (!prevModels.some((model) => model.name === newModel.name)) {
                        return [
                            ...prevModels,
                            { name: newModel.name, data: newModel, key: `${newModel.name}-${Date.now()}` },
                        ];
                    }
                    return prevModels;
                });
            }
        });

        return () => {
            socket.disconnect(); // Clean up the WebSocket connection on component unmount
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
                            key={model.key} // Use the unique key
                            className="flex items-center justify-center"
                        >
                            <iframe
                                className="border border-sky-500 rounded"
                                width="100%"
                                height="100%"
                                src={`https://chaturbate.com/fullvideo/?b=${model.name}&campaign=QdzcL&signup_notice=1&tour=Limj&disable_sound=0&quality=240`}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-4">Loading more models...</div>
            )}
            {/* Offline log tracker */}
            <div className="absolute bottom-4 right-4 bg-gray-800 text-white rounded shadow-lg p-4 w-1/4 h-1/4 overflow-y-auto offline-log">
                <h3 className="text-lg font-bold mb-2">Offline Activity Log</h3>
                {offlineLog.length > 0 ? (
                    offlineLog.map((log, index) => (
                        <div key={index} className="text-sm border-b border-gray-600 py-1">
                            <span className="font-semibold">{log.user}</span> is offline at checking{' '}
                            {log.timestamp.toLocaleTimeString()}
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-400">No offline activity yet.</p>
                )}
            </div>
        </div>
    );
};

export default TV;
