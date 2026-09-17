import base64
import numpy as np
import cv2

def decode_base64_to_rgb_array(base64_string: str):
    # Strip the HTML5 canvas data URL prefix if it exists
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
        
    img_bytes = base64.b64decode(base64_string)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    
    # Decode the image
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    
    # dlib requires RGB, but OpenCV decodes in BGR. Convert it.
    if img is not None:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
    return img