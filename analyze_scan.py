import sys
import tensorflow as tf
from tensorflow import keras
from PIL import Image
import numpy as np
import os
import contextlib
import io
import warnings
import json

# Define custom Maxout layer
class Maxout(keras.layers.Layer):
    def __init__(self, units, **kwargs):
        super(Maxout, self).__init__(**kwargs)
        self.units = units
    
    def build(self, input_shape):
        self.kernel = self.add_weight(
            'kernel',
            shape=[input_shape[-1], self.units * 2],
            initializer='glorot_uniform',
            trainable=True)
        self.bias = self.add_weight(
            'bias',
            shape=[self.units * 2],
            initializer='zeros',
            trainable=True)
        
    def call(self, inputs):
        inputs = tf.matmul(inputs, self.kernel) + self.bias
        inputs = tf.reshape(inputs, [-1, self.units, 2])
        return tf.reduce_max(inputs, axis=2)
    
    def get_config(self):
        config = super(Maxout, self).get_config()
        config.update({'units': self.units})
        return config

# Get absolute path to the model file
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cogniscan_model.h5')
IMG_SIZE = (224, 224)

# Global model cache
_model = None

def suppress_tf_logs():
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
    tf.get_logger().setLevel('ERROR')
    warnings.filterwarnings('ignore')

def is_brain_mri(img_path, img):
    try:
        # Quick validation for testing
        return True
    except Exception as e:
        print(json.dumps({'error': f'Error checking image type: {str(e)}'}))
        return False

def process_image(img_path):
    try:
        img = Image.open(img_path)
        if not is_brain_mri(img_path, img):
            return {'error': 'The uploaded image does not appear to be a brain MRI. Please upload a valid brain MRI scan.'}
        
        # Optimize image processing
        img = img.convert('RGB').resize(IMG_SIZE, Image.Resampling.BILINEAR)
        img_array = np.array(img, dtype=np.float32) / 255.0
        return np.expand_dims(img_array, axis=0)
    except Exception as e:
        return {'error': f'Error processing image: {str(e)}'}

def load_model():
    global _model
    try:
        if _model is not None:
            return _model, None
            
        if not os.path.exists(MODEL_PATH):
            return None, f'Model file not found at {MODEL_PATH}'
            
        # Enable mixed precision for faster inference
        tf.keras.mixed_precision.set_global_policy('mixed_float16')
        
        # Load model with custom objects
        _model = keras.models.load_model(MODEL_PATH, custom_objects={'Maxout': Maxout})
        return _model, None
    except Exception as e:
        return None, f'Error loading model: {str(e)}'

def get_analysis_result(class_idx, confidence):
    reports = [
        {
            'diagnosis': "Healthy",
            'findings': [
                "No significant signs of cognitive impairment detected",
                "Brain structure appears normal",
                "No concerning patterns identified"
            ]
        },
        {
            'diagnosis': "Mild Cognitive Impairment (MCI)",
            'findings': [
                "Mild changes in brain structure detected",
                "Early signs of cognitive decline present",
                "Patterns suggesting mild memory impairment"
            ]
        },
        {
            'diagnosis': "Alzheimer's Disease",
            'findings': [
                "Significant changes in brain structure",
                "Patterns consistent with Alzheimer's disease",
                "Notable cognitive decline indicators"
            ]
        }
    ]
    
    if 0 <= class_idx < len(reports):
        result = reports[class_idx]
        return {
            'diagnosis': result['diagnosis'],
            'confidence': float(confidence),
            'findings': result['findings']
        }
    return {
        'diagnosis': 'Unknown',
        'confidence': 0.0,
        'findings': ['Unable to determine diagnosis']
    }

def main():
    try:
        suppress_tf_logs()
        
        if len(sys.argv) < 2:
            print(json.dumps({'error': 'No image file provided'}))
            return
        
        img_path = sys.argv[1]
        if not os.path.exists(img_path):
            print(json.dumps({'error': 'Image file does not exist'}))
            return
        
        # Process image
        img_array = process_image(img_path)
        if isinstance(img_array, dict) and 'error' in img_array:
            print(json.dumps(img_array))
            return
        
        # Load model (uses cache if available)
        model, error = load_model()
        if error:
            print(json.dumps({'error': error}))
            return
        
        # Make prediction with reduced verbosity
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            preds = model.predict(img_array, verbose=0)
        
        # Interpret result
        if preds.shape[-1] == 1:
            confidence = float(preds[0][0])
            class_idx = 1 if confidence > 0.5 else 0
        else:
            class_idx = int(np.argmax(preds[0]))
            confidence = float(preds[0][class_idx])
        
        # Get formatted result
        result = get_analysis_result(class_idx, confidence)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'error': f'Unexpected error: {str(e)}'}))

if __name__ == '__main__':
    main() 