from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Store the list of online models
online_models = []

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
        # Remove the model from the server's online list
        online_models = [model for model in online_models if model.get('name') != model_name]
    else:
        # Handle online models (existing logic)
        response = get_model_data(model_name)
        if response.status_code == 200:
            model_data = response.json()
            model_data['name'] = model_name
            online_models.append(model_data)
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
    PORT = 4000
    socketio.run(app, host='0.0.0.0', port=PORT, debug=True)
