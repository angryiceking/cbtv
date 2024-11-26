/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { fetchData } from '../api/client';
import tastyModels from '../api/tasty_models.json';

const TV = () => {
    const [onlineModels, setOnlineModels] = useState([]);
    const [offlineLog, setOfflineLog] = useState([])
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null); // For pop-up notifications
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 1000); // Remove notification after 3 seconds
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
    

    useEffect(() => {
        let isMounted = true; // To avoid state updates on unmounted components

        const fetchTastyModels = async () => {
            setLoading(true);
            try {
                const newOnlineModels = [];
                for (let i = 0; i < tastyModels.length; i++) {
                    const model = tastyModels[i];
                    try {
                        const data = await fetchData(`/biocontext/${model}`);
                        if (data && (data.room_status === 'public' || data.room_status === 'private' || data.room_status === 'hidden')) {
                            newOnlineModels.push({
                                name: model,
                                data: data,
                                key: `${model}-${Date.now()}`, // Unique key to identify the iframe
                            });
                            if (isMounted) {
                                setOnlineModels((prevModels) => {
                                    // Preserve existing models and only update changed ones
                                    const updatedModels = newOnlineModels.map((newModel) => {
                                        const existingModel = prevModels.find(
                                            (prevModel) => prevModel.name === newModel.name
                                        );
                                        return existingModel || newModel;
                                    });

                                    return updatedModels;
                                });
                            }
                        } else if (isMounted) {
                            // Show notification if model is offline
                            logOfflineUser(model);
                            showNotification(`${model} is currently offline.`);
                        }
                    } catch {
                        console.error(`Error fetching status for ${model}`);
                    }
                    await delay(2000); // Delay of 2 seconds
                }
            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchTastyModels();

        const interval = setInterval(() => {
            fetchTastyModels();
        }, 10 * 60 * 1000); // Refresh every 30 minutes

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="relative min-h-screen">
            {error && <div className="text-center text-red-500 p-4">{error}</div>}
            {notification && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
                    {notification}
                </div>
            )}
            {onlineModels && onlineModels.length !== 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
                    {onlineModels.map((model) => (
                        <div
                            key={model.key} // Use the unique key
                            className="rounded flex flex-col items-center"
                        >
                            <iframe
                                className='border border-sky-500 rounded'
                                width={480}
                                height={360}
                                src={`https://chaturbate.com/fullvideo/?b=${model.name}&campaign=QdzcL&signup_notice=1&tour=Limj&disable_sound=0`}
                            />
                            <div>
                                <h2 className="text-lg font-bold">{model.name}</h2>
                            </div>
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
