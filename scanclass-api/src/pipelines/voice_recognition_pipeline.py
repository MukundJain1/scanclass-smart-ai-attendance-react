from resemblyzer import VoiceEncoder, preprocess_wav
import numpy as np
import io
import librosa
import logging # Added built-in logging for backend server logs

def load_voice_encoder():
    return VoiceEncoder()

def get_voice_embedding(audio_bytes):
    try:
        encoder = load_voice_encoder()

        audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000)
        wav = preprocess_wav(audio)
        embeddings = encoder.embed_utterance(wav)

        return list(embeddings)

    except Exception as e:
        # Replaced st.error with logging so it prints to the Render console
        logging.error(f"A voice recognition error: {e}") 
        return None

def identify_speaker(new_embeddings, candidate_dict, threshold=0.65):
    if new_embeddings is None or not candidate_dict:
        return None, 0.0

    best_stud_id = None
    best_score = -1

    for sid, stored_embedding in candidate_dict.items():
        if stored_embedding:
            similarity = np.dot(new_embeddings, stored_embedding)

            if similarity > best_score:
                best_score = similarity
                best_stud_id = sid

    if best_score >= threshold:
        return best_stud_id, best_score
    return None, best_score


def process_bulk_audio(audio_bytes, candidate_dict, threshold=0.65):
    try:
        encoder = load_voice_encoder()

        audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000)

        # top_db is sensitivity: too low can catch whispering, too high captures only shouting
        segments = librosa.effects.split(audio, top_db=30) 
        identify_result = {}

        for start, end in segments:
            if (end-start) < sr*0.5:
                continue

            segment_audio = audio[start:end]
            wav = preprocess_wav(segment_audio)
            embedding = encoder.embed_utterance(wav)

            sid, score = identify_speaker(embedding, candidate_dict, threshold)

            if sid:
                if sid not in identify_result or score > identify_result[sid]:
                    identify_result[sid] = score

        return identify_result
    
    except Exception as e:
        # Replaced st.error with logging
        logging.error(f"Bulk process error: {e}") 
        return None