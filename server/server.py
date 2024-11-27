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
@app.route('/api/webhook', methods=['POST'])
def webhook():
    """
    Webhook to receive model names from the script app.
    """
    global online_models
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({"error": "Invalid data"}), 400

    model_name = data['name']
    print(f"Webhook received: {model_name}")

    # Fetch model data using the /api/biocontext/<username> route
    response = get_model_data(model_name)
    if response.status_code == 200:
        model_data = response.json()
        model_data['name'] = model_name
        online_models.append(model_data)

        print(f"Emitting model update for: {model_data}")
        # Notify all connected clients about the new model
        socketio.emit('model_update', model_data)

        return jsonify({"message": f"Model {model_name} added.", "data": model_data}), 200
    else:
        return jsonify({"error": f"Failed to fetch data for {model_name}"}), response.status_code


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
