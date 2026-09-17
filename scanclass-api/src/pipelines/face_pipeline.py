import dlib
import numpy as np
import json
import face_recognition_models
from sklearn.svm import SVC
from src.database.db import get_all_students

# Native Python caching for FastAPI
_dlib_models = None
_trained_model_data = None

def load_dlib_models():
    global _dlib_models
    if _dlib_models is None:
        detector = dlib.get_frontal_face_detector()  # type: ignore[attr-defined]
        
        sp = dlib.shape_predictor(  # type: ignore[attr-defined]
            face_recognition_models.pose_predictor_model_location()
        )
        
        facerec = dlib.face_recognition_model_v1(  # type: ignore[attr-defined]
            face_recognition_models.face_recognition_model_location()
        )
        
        _dlib_models = (detector, sp, facerec)
    return _dlib_models

def get_face_embeddings(image):
    detector, sp, facerec = load_dlib_models()
    faces = detector(image, 1) 
    encodings = []

    for face in faces:
        shape = sp(image, face) 
        face_descriptor = facerec.compute_face_descriptor(image, shape, 1) 
        encodings.append(np.array(face_descriptor))

    return encodings

def get_trained_model():
    global _trained_model_data
    
    # Return cached model if it exists
    if _trained_model_data is not None:
        return _trained_model_data

    X = []
    y = []
    student_db = get_all_students()

    if not student_db:
        return None

    for student in student_db:
        embedding = student.get("face_embedding")
        if embedding:
            # Handle Supabase returning vector arrays as string representations
            if isinstance(embedding, str):
                embedding = json.loads(embedding)
            X.append(np.array(embedding))
            y.append(student.get('student_id'))

    if len(X) == 0:
        return None

    X_arr = np.array(X)
    unique_classes = list(set(y))
    
    model = None
    
    # SVC requires at least 2 distinct people to draw a classification boundary
    if len(unique_classes) > 1:
        model = SVC(kernel="linear", probability=True, class_weight='balanced')
        try:
            model.fit(X_arr, y)
        except ValueError:
            model = None

    # We store X and y even if model is None, so we can do direct distance checks for 1 student
    _trained_model_data = {'model': model, 'X': X, 'y': y}
    
    return _trained_model_data

def train_classifier():
    global _trained_model_data
    
    # Clear the native Python cache so it is forced to retrain on the next scan
    _trained_model_data = None 
    model_data = get_trained_model()
    return bool(model_data)

def predict_attendance(class_image):
    encodings = get_face_embeddings(class_image)
    detected_student = {}
    model_data = get_trained_model()

    if not model_data:
        return detected_student, [], len(encodings)

    model = model_data['model']
    X_train = model_data['X']
    y_train = model_data['y']

    all_students = sorted(list(set(y_train)))

    for encoding in encodings:
        predicted_id = None
        
        # If model exists (2+ students), let the AI predict
        if model is not None:
            predicted_id = int(model.predict(encoding.reshape(1, -1))[0])
        else:
            # If only 1 student exists, default to checking against them directly
            predicted_id = int(all_students[0])

        # Get the actual embeddings for the predicted student to verify the match
        student_embeddings = X_train[y_train.index(predicted_id)]
        best_match_score = np.linalg.norm(student_embeddings - encoding)
        
        resemblance_threshold = 0.6

        # Only count as present if the face is actually a strong match (prevents false positives)
        if best_match_score <= resemblance_threshold:
            detected_student[predicted_id] = True

    return detected_student, all_students, len(encodings)