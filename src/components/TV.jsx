/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { fetchData } from '../api/client';
import tastyModels from '../api/tasty_models.json';

const TV = () => {
    const [onlineModels, setOnlineModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
                        if (data && data.room_status === 'public') {
                            newOnlineModels.push({
                                name: model,
                                image: data.image_url,
                                data: data,
                            });
                        }
                    } catch {
                        console.error(`Error fetching status for ${model}`);
                    }
                    await delay(1000); // Delay of 1 second
                }

                // Update the online models list
                if (isMounted) {
                    setOnlineModels((prevModels) => {
                        // Add new models, replace duplicates, and remove models that are no longer online
                        const updatedModels = newOnlineModels.filter((newModel) =>
                            !prevModels.some((prevModel) => prevModel.name === newModel.name)
                        );
                        const removedModels = prevModels.filter((prevModel) =>
                            newOnlineModels.some((newModel) => newModel.name === prevModel.name)
                        );

                        return [...updatedModels, ...removedModels];
                    });
                }
            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchTastyModels();

        // Set an interval to refresh the data every 30 minutes
        const interval = setInterval(() => {
            fetchTastyModels();
        }, 30 * 60 * 1000); // 30 minutes in milliseconds

        return () => {
            isMounted = false; // Cleanup to prevent setting state after unmount
            clearInterval(interval); // Clear the interval
        };
    }, []); // Ensure dependency array is empty

    return (
        <div className="">
            {error && <div className="text-center text-red-500 p-4">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
                {onlineModels.map((model, index) => (
                    <div
                        key={index}
                        className="rounded flex flex-col items-center"
                    >
                        <iframe
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
            {loading && <div className="text-center p-4">Loading more models...</div>}
        </div>
    );
};

export default TV;
