from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import requests
import threading
import time

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Store the list of online models
online_models = {}


def fetch_viewer_count():
    while True:
        for model_name in list(online_models.keys()):
            try:
                response = requests.get(f"https://chaturbate.com/api/getchatuserlist/?roomname={model_name}&private=false&sort_by=a&exclude_staff=false")  # Replace with actual URL
                if response.status_code == 200:
                    data = response.text.split(',')
                    anonymous_count = int(data[0]) 
                    registered_users = len(data[1:])
                    total_viewer_count = anonymous_count + registered_users  # Calculate total viewers
                    socketio.emit('viewer_update', {'name': model_name, 'viewer_count': total_viewer_count})
            except Exception as e:
                print(f"Error fetching viewer count for {model_name}: {e}")
        time.sleep(300)  # 5 minutes
        

@app.route('/api/viewer_count', methods=['GET'])
def viewer_count():
    """
    API endpoint to fetch the viewer count for a specific model.
    """
    model_name = request.args.get('model')
    if not model_name:
        return jsonify({"error": "Model name is required"}), 400

    try:
        # Fetch viewer count from the external API
        response = requests.get(f"https://chaturbate.com/api/getchatuserlist/?roomname={model_name}&private=false&sort_by=a&exclude_staff=false", timeout=10)
        if response.status_code == 200:
            # Split the response into parts
            data = response.text.split(',')
            anonymous_count = int(data[0])
            registered_users = len(data[1:])
            total_viewer_count = anonymous_count + registered_users
            return jsonify({"name": model_name, "viewer_count": total_viewer_count}), 200
        else:
            return jsonify({"error": f"Failed to fetch viewer count for {model_name}", "status_code": response.status_code}), 500
    except Exception as e:
        print(f"Error fetching viewer count for {model_name}: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/online', methods=['POST'])
def update_online_models():
    data = request.json
    online_models[data['name']] = True
    socketio.emit('model_update', {'name': data['name']})
    return jsonify({'message': 'Model added'}), 200


@app.route('/api/offline', methods=['POST'])
def update_offline_models():
    data = request.json
    if data['name'] in online_models:
        del online_models[data['name']]
    socketio.emit('model_remove', {'name': data['name']})
    return jsonify({'message': 'Model removed'}), 200

@app.route('/api/webhook', methods=['POST'])
def webhook():
    """
    Webhook to receive model updates (online/offline).
    """
    global online_models
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({"error": "Invalid data"}), 400

    model_name = data['name']
    room_status = data.get('room_status')

    if room_status == 'offline':
        print(f"Model {model_name} went offline")
        # Notify React clients to remove the model
        socketio.emit('model_remove', {"name": model_name})
        # Remove the model from the server's online dictionary
        if model_name in online_models:
            del online_models[model_name]
    else:
        print(f"Model {model_name} went online or updated")
        # Handle online models
        response = get_model_data(model_name)
        if response.status_code == 200:
            model_data = response.json()
            model_data['name'] = model_name

            # Add or update the model in the dictionary
            online_models[model_name] = model_data

            # Notify React clients of the updated/added model
            socketio.emit('model_update', model_data)

    return jsonify({"message": f"Processed model {model_name} with status {room_status}"}), 200




@app.route('/api/biocontext/<string:username>', methods=['GET'])
def get_biocontext(username):
    """
    Fetch the status of a specific model from the external API.
    """
    return get_model_data(username)


def get_model_data(username):
    """
    Helper function to fetch model data from the external API.
    """
    try:
        response = requests.get(f"https://chaturbate.com/api/biocontext/{username}", timeout=10)
        response.raise_for_status()
        return response
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data for {username}: {e}")
        return jsonify({"error": str(e)}), 500


@socketio.on('connect')
def handle_connect():
    """
    Handle new client connections.
    """
    print("Client connected")
    # Send the current list of online models to the connected client
    emit('initial_data', {"models": online_models})


@socketio.on('disconnect')
def handle_disconnect():
    """
    Handle client disconnections.
    """
    print("Client disconnected")


if __name__ == '__main__':
    threading.Thread(target=fetch_viewer_count, daemon=True).start()
    socketio.run(app, host='0.0.0.0', port=4000)