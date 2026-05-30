def detect_intent(message):
    msg = message.lower()

    if "fee" in msg or "fees" in msg or "price" in msg:
        return "fees"

    if "timetable" in msg or "schedule" in msg or "time table" in msg:
        return "timetable"

    if "exam" in msg or "test" in msg:
        return "exams"

    return "doubt"