# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the server files into the image
COPY . .

# Expose the server port
EXPOSE 4000

# Start the Flask app
CMD ["python", "server.py"]
