import subprocess
import sys
import os

# Install tensorflowjs if needed
try:
    import tensorflowjs as tfjs
except ImportError:
    print("Installing tensorflowjs...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "tensorflowjs"])
    import tensorflowjs as tfjs

import tensorflow as tf

MODEL_PATH = os.path.expanduser("~/Desktop/ecoscan_model.keras")
OUTPUT_DIR = os.path.expanduser("~/Desktop/ecoscan-ai-main/public/model")

print("Loading model...")
model = tf.keras.models.load_model(MODEL_PATH)

print(f"Converting to TensorFlow.js format -> {OUTPUT_DIR}")
os.makedirs(OUTPUT_DIR, exist_ok=True)
tfjs.converters.save_keras_model(model, OUTPUT_DIR)

print("✅ Done! Model saved to:", OUTPUT_DIR)
print("Files created:")
for f in os.listdir(OUTPUT_DIR):
    print(" -", f)
