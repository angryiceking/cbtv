/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';

const AFK = () => {
    const [position, setPosition] = useState({ x: 50, y: 50 });
    const [direction, setDirection] = useState({ x: 1, y: 1 });
    const [color, setColor] = useState('blue'); // Default color

    // Generate a random color
    const getRandomColor = () => {
        const colors = ['red', 'green', 'blue', 'orange', 'purple', 'pink', 'yellow', 'cyan'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    useEffect(() => {
        const updatePosition = () => {
            setPosition((prevPosition) => {
                const newX = prevPosition.x + 3 * direction.x;
                const newY = prevPosition.y + 3 * direction.y;

                let hitEdge = false;
                const newDirection = { ...direction };

                // Reverse direction and flag edge hit
                if (newX <= 0 || newX >= window.innerWidth - 100) {
                    newDirection.x = -direction.x;
                    hitEdge = true;
                }
                if (newY <= 0 || newY >= window.innerHeight - 100) {
                    newDirection.y = -direction.y;
                    hitEdge = true;
                }

                if (hitEdge) {
                    setColor(getRandomColor()); // Change color on edge hit
                }

                setDirection(newDirection);

                return { x: newX, y: newY };
            });
        };

        const interval = setInterval(updatePosition, 16); // Smooth animation at ~60fps
        return () => clearInterval(interval); // Cleanup
    }, [direction]);

    return (
        <div
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                width: '170px',
                height: '100px',
                backgroundColor: color, // Apply the dynamic color
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                userSelect: 'none',
            }}
        >
            <small className='text-center'><b>CBTV</b> <br /> No Models Online</small>
        </div>
    );
};

export default AFK;

