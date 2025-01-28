import os
import csv
import secrets
from io import TextIOWrapper
from functools import wraps

from flask import Blueprint, request, jsonify, session, redirect, render_template
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from sqlalchemy.exc import IntegrityError
from twilio.rest import Client

# Import the shared db and models
from .models import db, User, VerifiedDetail

# Create a Blueprint instead of a new Flask app
main_bp = Blueprint("main_bp", __name__)

# --------------------------------
#        ENV + CONFIG
# --------------------------------
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "isaac")
DB_PASS = os.getenv("DB_PASS", "Isaac123")
DB_NAME = os.getenv("DB_NAME", "HUPhoneVerification")
SIGNUP_KEY = os.getenv("SIGNUP_KEY", "HowardResearch2025")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")


# --------------------------------
#     LOGIN REQUIRED DECORATOR
# --------------------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("logged_in"):
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function


# --------------------------------
#             ROUTES
# --------------------------------
@main_bp.route("/")
def root_route():
    return redirect("/login")


# ------------------ SIGNUP (PUBLIC) -------------------
@main_bp.route("/signup", methods=["GET", "POST"])
def signup():
    # If already logged in, bounce to /home
    if session.get("logged_in"):
        return redirect("/home")

    if request.method == "GET":
        return render_template("signup.html")

    # Handle POST (JSON fetch)
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Grab fields
    provided_key = data.get("signup_key")
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    # Basic validation
    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if provided_key != "HowardResearch2025":
        return jsonify({"error": "Invalid signup key"}), 403

    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "User with this email already exists"}), 400

    # Create user
    hashed_pw = generate_password_hash(password)
    new_user = User(name=name, email=email, password_hash=hashed_pw)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201



# ------------------ LOGIN (PUBLIC) -------------------
@main_bp.route("/login", methods=["GET", "POST"])
def login():
    # If already logged in, bounce to /home
    if session.get("logged_in"):
        return redirect("/home")

    if request.method == "GET":
        return render_template("login.html")

    # Handle POST (JSON or form)
    data = request.json if request.is_json else request.form
    if not data:
        return jsonify({"error": "No login data provided"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    session["logged_in"] = True
    session["user_id"] = user.id
    return redirect("/home")


# ------------------ LOGOUT (PROTECTED) -------------------
@main_bp.route("/logout")
@login_required
def logout():
    session.clear()
    return redirect("/login")


# ------------------ PROTECTED PAGES -------------------
@main_bp.route("/home")
@login_required
def home_page():
    return render_template("home.html")

@main_bp.route("/verify")
@login_required
def verify_page():
    return render_template("verify.html")

@main_bp.route("/verified-phones")
@login_required
def verified_phone_page():
    return render_template("verified-phones.html")

@main_bp.route("/single-verify")
@login_required
def single_verify_page():
    return render_template("single-verify.html")

@main_bp.route("/upload-verify")
@login_required
def upload_verify_page():
    return render_template("upload-verify.html")


# ------------------ LIST VERIFIED (PROTECTED) -------------------
@main_bp.route("/verified-list", methods=["GET"])
@login_required
def get_verified_list():
    records = VerifiedDetail.query.order_by(VerifiedDetail.created_at.desc()).all()
    results = []
    for rec in records:
        results.append({
            "id": rec.id,
            "first_name": rec.first_name,
            "last_name": rec.last_name,
            "email": rec.email,
            "phone_number": rec.phone_number,
            "created_at": rec.created_at.isoformat() if rec.created_at else None,
            "status": rec.status
        })
    return jsonify(results), 200


# ------------------ DELETE VERIFIED (PROTECTED) -------------------
@main_bp.route("/delete-verified/<int:record_id>", methods=["DELETE"])
@login_required
def delete_verified(record_id):
    record = VerifiedDetail.query.get(record_id)
    if not record:
        return jsonify({"error": "Record not found"}), 404

    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "Record deleted successfully"}), 200


# ------------------ VERIFY PHONE (PROTECTED) -------------------
@main_bp.route("/verify-phone", methods=["POST"])
@login_required
def verify_phone():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    first_name = data.get("firstName")
    last_name = data.get("lastName")
    email = data.get("email")
    input_phone = data.get("phoneNumber")

    if not first_name or not last_name or not email or not input_phone:
        return jsonify({"error": "firstName, lastName, email, and phoneNumber are required"}), 400

    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return jsonify({"error": "Twilio credentials not set"}), 500

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        lookup = client.lookups.v2.phone_numbers(input_phone).fetch(
            fields="caller_name,line_type_intelligence,call_forwarding"
        )
        e164_phone = lookup.phone_number

        existing = VerifiedDetail.query.filter_by(phone_number=e164_phone).first()
        if existing:
            return jsonify({
                "alreadyExists": True,
                "firstName": existing.first_name,
                "lastName": existing.last_name,
                "email": existing.email,
                "phone_number": existing.phone_number,
                "status": existing.status
            }), 200

        # Basic checks
        is_valid = True
        reasons = []
        country_code = lookup.country_code
        line_info = lookup.line_type_intelligence or {}
        carrier_name = line_info.get("carrier_name")
        error_code = line_info.get("error_code")

        if error_code:
            is_valid = False
            reasons.append("Line type error code returned.")
        if country_code != "US":
            is_valid = False
            reasons.append("Number is not a US number.")
        if not carrier_name or carrier_name.strip() == "":
            is_valid = False
            reasons.append("Carrier name unknown.")

        if is_valid:
            new_verified = VerifiedDetail(
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone_number=e164_phone,
                status="valid"
            )
            db.session.add(new_verified)
            try:
                db.session.commit()
            except IntegrityError as ie:
                db.session.rollback()
                if "Duplicate entry" in str(ie.orig):
                    return jsonify({
                        "alreadyExists": True,
                        "error": "This phone number is already in the database."
                    }), 400
                else:
                    return jsonify({"error": "Database Integrity Error"}), 400

            return jsonify({
                "alreadyExists": False,
                "valid": True,
                "phone_number": e164_phone,
                "country_code": country_code,
                "line_type": line_info.get("type"),
                "carrier_name": carrier_name
            }), 200
        else:
            # Store as invalid
            new_verified = VerifiedDetail(
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone_number=e164_phone,
                status="invalid"
            )
            db.session.add(new_verified)
            try:
                db.session.commit()
            except IntegrityError:
                db.session.rollback()
                # Possibly skip or handle duplicates differently
                pass

            return jsonify({
                "alreadyExists": False,
                "valid": False,
                "phone_number": e164_phone,
                "reasons": reasons
            }), 200

    except Exception as e:
        return jsonify({
            "alreadyExists": False,
            "valid": False,
            "phone_number": input_phone,
            "reasons": ["Twilio exception occurred."],
            "validation_errors": str(e)
        }), 400


# ------------------ CHECK DUPLICATE (PROTECTED) -------------------
@main_bp.route("/check-duplicate", methods=["POST"])
@login_required
def check_duplicate():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    input_phone = data.get("phoneNumber")
    email = data.get("email")
    if not input_phone or not email:
        return jsonify({"error": "phoneNumber and email are required"}), 400

    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return jsonify({"error": "Twilio credentials not set"}), 500

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        lookup = client.lookups.v2.phone_numbers(input_phone).fetch(
            fields="caller_name,line_type_intelligence,call_forwarding"
        )
        e164_phone = lookup.phone_number

        existing = VerifiedDetail.query.filter_by(phone_number=e164_phone, email=email).first()
        if existing:
            return jsonify({
                "isDuplicate": True,
                "message": "A record with this phone number and email already exists.",
                "status": existing.status
            }), 200
        else:
            return jsonify({
                "isDuplicate": False,
                "message": "No duplicate found."
            }), 200

    except Exception as e:
        return jsonify({
            "isDuplicate": False,
            "message": f"Error checking duplicate: {str(e)}"
        }), 400


# ------------------ BULK CSV UPLOAD (PROTECTED) -------------------
@main_bp.route("/upload-csv", methods=["POST"])
@login_required
def upload_csv():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Uploaded file has no name"}), 400

    try:
        stream = TextIOWrapper(file, encoding="utf-8")
        reader = csv.reader(stream)
    except Exception as e:
        return jsonify({"error": f"Error reading file: {str(e)}"}), 400

    header = next(reader, None)
    if not header:
        return jsonify({"error": "CSV file is empty or corrupted."}), 400

    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return jsonify({"error": "Twilio credentials not set"}), 500

    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    success_count = 0
    fail_count = 0
    row_results = []

    for i, row in enumerate(reader, start=1):
        if len(row) < 4:
            fail_count += 1
            row_results.append({
                "rowIndex": i,
                "firstName": "",
                "lastName": "",
                "email": "",
                "phoneNumber": "",
                "status": "INVALID",
                "reasons": ["Not enough columns"]
            })
            continue

        first_name, last_name, email, input_phone = [col.strip() for col in row]
        row_info = {
            "rowIndex": i,
            "firstName": first_name,
            "lastName": last_name,
            "email": email,
            "phoneNumber": input_phone,
            "status": "INVALID",
            "reasons": []
        }

        if not first_name or not last_name or not email or not input_phone:
            fail_count += 1
            row_info["reasons"].append("Missing required field(s)")
            row_results.append(row_info)
            continue

        try:
            result = client.lookups.v2.phone_numbers(input_phone).fetch(
                fields="caller_name,line_type_intelligence,call_forwarding"
            )
            e164_phone = result.phone_number
            row_info["phoneNumber"] = e164_phone

            existing = VerifiedDetail.query.filter_by(phone_number=e164_phone).first()
            if existing:
                fail_count += 1
                row_info["status"] = "DUPLICATE"
                row_info["reasons"].append("Number already in database")
                row_results.append(row_info)
                continue

            country_code = result.country_code
            line_info = result.line_type_intelligence or {}
            carrier_name = line_info.get("carrier_name")
            error_code = line_info.get("error_code")

            invalid_reasons = []
            if error_code:
                invalid_reasons.append("Line type error code returned.")
            if country_code != "US":
                invalid_reasons.append("Number is not a US number.")
            if not carrier_name or carrier_name.strip() == "":
                invalid_reasons.append("Carrier name unknown.")

            if invalid_reasons:
                fail_count += 1
                row_info["status"] = "INVALID"
                row_info["reasons"] = invalid_reasons

                # store as "invalid"
                new_verified = VerifiedDetail(
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    phone_number=e164_phone,
                    status="invalid"
                )
                db.session.add(new_verified)
                db.session.commit()

                row_results.append(row_info)
                continue

            # If it passes all checks, mark valid
            new_verified = VerifiedDetail(
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone_number=e164_phone,
                status="valid"
            )
            db.session.add(new_verified)
            db.session.commit()

            success_count += 1
            row_info["status"] = "VALID"
            row_info["reasons"] = []

        except Exception as exc:
            fail_count += 1
            row_info["status"] = "INVALID"
            row_info["reasons"].append(f"Twilio/Exception: {str(exc)}")

        row_results.append(row_info)

    return jsonify({
        "success_count": success_count,
        "fail_count": fail_count,
        "row_results": row_results
    }), 200


# ------------------ REVALIDATE (PROTECTED) -------------------
@main_bp.route("/revalidate/<int:record_id>", methods=["POST"])
@login_required
def revalidate_number(record_id):
    record = VerifiedDetail.query.get(record_id)
    if not record:
        return jsonify({"error": "Record not found"}), 404

    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return jsonify({"error": "Twilio credentials not set"}), 500

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        lookup = client.lookups.v2.phone_numbers(record.phone_number).fetch(
            fields="caller_name,line_type_intelligence,call_forwarding"
        )
        country_code = lookup.country_code
        line_info = lookup.line_type_intelligence or {}
        carrier_name = line_info.get("carrier_name")
        error_code = line_info.get("error_code")

        is_valid = True
        reasons = []
        if error_code:
            is_valid = False
            reasons.append("Line type error code returned.")
        if country_code != "US":
            is_valid = False
            reasons.append("Number is not a US number.")
        if not carrier_name or carrier_name.strip() == "":
            is_valid = False
            reasons.append("Carrier name unknown.")

        # Update the record
        record.status = "valid" if is_valid else "invalid"
        db.session.commit()

        return jsonify({
            "id": record.id,
            "status": record.status,
            "reasons": reasons
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Revalidate exception occurred.",
            "details": str(e)
        }), 400
