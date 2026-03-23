from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)

# Load the trained model
MODEL_PATH = "garbage_classification_model_inception.h5"
model = tf.keras.models.load_model(MODEL_PATH)

# Define image dimensions
img_height = 512
img_width = 384

# Waste categories and disposal information
WASTE_CATEGORIES = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash']

DISPOSAL_INFO = {
    'cardboard': {
        'category': 'Recyclable',
        'disposalTip': 'Flatten cardboard boxes before recycling. Remove any plastic tape or stickers.',
        'icon': 'Package'
    },
    'glass': {
        'category': 'Recyclable',
        'disposalTip': 'Separate glass by color when possible. Rinse containers before recycling.',
        'icon': 'Droplets'
    },
    'metal': {
        'category': 'Recyclable',
        'disposalTip': 'Rinse metal cans and containers. Remove caps and lids.',
        'icon': 'Cpu'
    },
    'paper': {
        'category': 'Recyclable',
        'disposalTip': 'Keep paper dry and free from food residue. Bundle papers together.',
        'icon': 'Newspaper'
    },
    'plastic': {
        'category': 'Recyclable',
        'disposalTip': 'Rinse plastic containers. Check local guidelines for recyclable plastic types.',
        'icon': 'Wine'
    },
    'trash': {
        'category': 'General Waste',
        'disposalTip': 'Place in regular waste bin. This item cannot be recycled.',
        'icon': 'Trash2'
    }
}

@app.route('/api/classify-waste', methods=['POST'])
def classify_waste():
    try:
        # Get the image from the request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Read and preprocess the image
        img_data = file.read()
        img = Image.open(io.BytesIO(img_data))
        
        # Ensure RGB
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize
        img = img.resize((img_width, img_height))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        # Make prediction
        prediction = model.predict(img_array, verbose=0)
        predicted_index = np.argmax(prediction)
        confidence = float(prediction[0][predicted_index])
        predicted_category = WASTE_CATEGORIES[predicted_index]

        # Get disposal info
        info = DISPOSAL_INFO.get(predicted_category, DISPOSAL_INFO['trash'])

        # Create breakdown of all predictions
        breakdown = [
            {'type': cat, 'pct': round(float(pred) * 100, 2)}
            for cat, pred in zip(WASTE_CATEGORIES, prediction[0])
        ]
        breakdown.sort(key=lambda x: x['pct'], reverse=True)

        return jsonify({
            'wasteType': predicted_category.capitalize(),
            'category': info['category'],
            'confidence': round(confidence * 100, 2),
            'disposalTip': info['disposalTip'],
            'breakdown': breakdown
        }), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': f'Classification failed: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'model': 'Loaded'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
