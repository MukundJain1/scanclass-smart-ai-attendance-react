from src.database.config import supabase
from src.database.db import get_all_students

def test_supabase():
    print("Testing Supabase connection...")
    try:
        students = get_all_students()
        print(f"Connection Successful! Found {len(students)} student record(s).")
    except Exception as err:
        print(f"Connection Failed: {err}")

if __name__ == "__main__":
    test_supabase()