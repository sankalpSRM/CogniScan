import sys
import tensorflow as tf
from tensorflow import keras
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
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mlp_model.h5')
INPUT_COUNT = 5

# Global model cache
_model = None

def suppress_tf_logs():
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
    tf.get_logger().setLevel('ERROR')
    warnings.filterwarnings('ignore')

def validate_inputs(features):
    try:
        if len(features) != INPUT_COUNT:
            return False, 'Exactly 5 input values are required'
        
        # Convert to float and validate ranges
        values = np.array([float(x) for x in features], dtype=np.float32)
        
        # Check ranges using numpy for efficiency
        if not (np.all(values[:4] >= 0) and np.all(values[:4] <= 3)):
            return False, 'First 4 values must be between 0 and 3'
        if not (0 <= values[4] <= 30):
            return False, 'MMSE Score must be between 0 and 30'
        
        return True, values
    except ValueError:
        return False, 'All inputs must be valid numbers'

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

def get_recommendations(confidence):
    if confidence > 0.5:
        return [
            "Schedule an appointment with a neurologist",
            "Consider additional cognitive testing",
            "Monitor symptoms closely",
            "Maintain a regular sleep schedule",
            "Stay mentally and socially active"
        ]
    return [
        "Continue regular health check-ups",
        "Maintain healthy lifestyle habits",
        "Stay physically and mentally active",
        "Monitor any changes in cognitive function",
        "Follow up with healthcare provider as needed"
    ]

def main():
    try:
        suppress_tf_logs()
        
        # Validate inputs
        valid, result = validate_inputs(sys.argv[1:])
        if not valid:
            print(json.dumps({'error': result}))
            return
        
        features = result
        x = features.reshape(1, -1)
        
        # Load model (uses cache if available)
        model, error = load_model()
        if error:
            print(json.dumps({'error': error}))
            return
        
        # Make prediction with reduced verbosity
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            pred = model.predict(x, verbose=0)
        
        # Calculate confidence
        confidence = float(pred[0][0]) if pred.shape[-1] == 1 else float(pred[0][np.argmax(pred[0])])
        
        # Prepare result
        result = {
            'result': 'Positive' if confidence > 0.5 else 'Negative',
            'confidence': confidence,
            'recommendations': get_recommendations(confidence)
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'error': f'Unexpected error: {str(e)}'}))

if __name__ == '__main__':
    main() 