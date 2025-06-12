# firebase.py
import firebase_admin
from firebase_admin import credentials, messaging
import os

firebase_app = None

# Initialize Firebase Admin SDK
def initialize_firebase():
    
    cred_dict = {
  "type": "service_account",
  "project_id": "shopping-manager-app",
  "private_key_id": os.getenv("PRIVATE_KEY_ID"),
  "private_key": os.getenv("PRIVATE_KEY").replace('\\n', '\n'),
  "client_id": os.getenv("CLIENT_ID"),
  "client_email": os.getenv("CLIENT_EMAIL"),
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": os.getenv('CLIENT_X509_CERT_URL'),
  "universe_domain": "googleapis.com"
}

    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)