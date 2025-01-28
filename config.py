import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key_here")

    # Use the no-spaces database:
    DB_NAME = "HUPhoneVerification"  

    # Example for socket connection:
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://isaac:Isaac123@localhost/HUPhoneVerification?unix_socket=/tmp/mysql.sock"

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Twilio, etc.
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    SIGNUP_KEY = os.getenv("SIGNUP_KEY", "HowardResearch2025")
