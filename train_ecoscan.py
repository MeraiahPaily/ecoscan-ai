import os
import shutil
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

# ─────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────
GARBAGE_DIR = os.path.expanduser("~/Desktop/garbage_classification")
ORGANIC_DIR = os.path.expanduser("~/Desktop/archive (1)/DATASET/TRAIN/O")
DATASET_DIR = os.path.expanduser("~/Desktop/ecoscan_dataset")
MODEL_SAVE_PATH = os.path.expanduser("~/Desktop/ecoscan_model.keras")
LABELS_PATH = os.path.expanduser("~/Desktop/ecoscan-ai-main/public/labels.json")

# ─────────────────────────────────────────────
# STEP 1 — Build unified dataset folder
# ─────────────────────────────────────────────
CLASS_MAP = {
    "Plastic":      ["plastic"],
    "Paper":        ["paper"],
    "Glass":        ["brown-glass", "green-glass", "white-glass"],
    "Metal":        ["metal"],
    "Cardboard":    ["cardboard"],
    "Clothes":      ["clothes", "shoes"],
    "Food_Compost": ["biological"],
}

print("📁 Building dataset...")

for class_name in list(CLASS_MAP.keys()) + ["Yard_Waste"]:
    os.makedirs(os.path.join(DATASET_DIR, class_name), exist_ok=True)

for class_name, source_folders in CLASS_MAP.items():
    dest = os.path.join(DATASET_DIR, class_name)
    for folder in source_folders:
        src = os.path.join(GARBAGE_DIR, folder)
        if not os.path.exists(src):
            print(f"  ⚠️  Folder not found: {src}")
            continue
        for img in os.listdir(src):
            if img.lower().endswith((".jpg", ".jpeg", ".png")):
                shutil.copy(os.path.join(src, img), os.path.join(dest, f"{folder}_{img}"))
    print(f"  ✅ {class_name}: {len(os.listdir(dest))} images")

yard_dest = os.path.join(DATASET_DIR, "Yard_Waste")
count = 0
for img in os.listdir(ORGANIC_DIR):
    if img.lower().endswith((".jpg", ".jpeg", ".png")) and count < 1000:
        shutil.copy(os.path.join(ORGANIC_DIR, img), os.path.join(yard_dest, img))
        count += 1
print(f"  ✅ Yard_Waste: {count} images")

# ─────────────────────────────────────────────
# STEP 2 — Data generators
# ─────────────────────────────────────────────
IMG_SIZE = (224, 224)
BATCH_SIZE = 32

train_datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    zoom_range=0.2,
    
)

train_gen = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

val_gen = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

print(f"\n📊 Classes: {train_gen.class_indices}")
NUM_CLASSES = len(train_gen.class_indices)

# ─────────────────────────────────────────────
# STEP 3 — Build model
# ─────────────────────────────────────────────
print("\n🧠 Building model...")

base_model = MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.3)(x)
output = Dense(NUM_CLASSES, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=output)
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# ─────────────────────────────────────────────
# STEP 4 — Train Phase 1
# ─────────────────────────────────────────────
print("\n🚀 Training Phase 1 (frozen base)...")

callbacks = [
    EarlyStopping(patience=5, restore_best_weights=True, verbose=1),
    ModelCheckpoint(MODEL_SAVE_PATH, save_best_only=True, verbose=1)
]

model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=20,
    callbacks=callbacks
)

# ─────────────────────────────────────────────
# STEP 5 — Fine-tune Phase 2
# ─────────────────────────────────────────────
print("\n🔧 Fine-tuning Phase 2...")

base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=10,
    callbacks=callbacks
)

# ─────────────────────────────────────────────
# STEP 6 — Save labels JSON
# ─────────────────────────────────────────────
class_labels = {str(v): k for k, v in train_gen.class_indices.items()}
os.makedirs(os.path.dirname(LABELS_PATH), exist_ok=True)
with open(LABELS_PATH, "w") as f:
    json.dump(class_labels, f)
print(f"\n✅ Labels saved to {LABELS_PATH}")
print(f"✅ Model saved to {MODEL_SAVE_PATH}")
print("\n🎉 Training complete!")
print("Next step: run convert_model.py to convert to TensorFlow.js format")
