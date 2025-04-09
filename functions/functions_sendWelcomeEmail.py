
import functions_framework
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import jsonify
import os

SMTP_SERVER = "smtp-relay.brevo.com"
SMTP_PORT = 587
SMTP_USERNAME = "officialtrackrepost@gmail.com"
API_KEY = os.environ.get("SENDINBLUE_KEY")
ea5a820b554827844bbc9ca509ad6118c303792f802bc5c0b47bf20ed3e0695a-z2ZVCJy03bs8KLpN"

@functions_framework.http
def send_welcome_email(request):
    request_json = request.get_json(silent=True)
    email = request_json.get("email")
    name = request_json.get("name", "friend")

    if not email:
        return jsonify({"error": "Missing email"}), 400

    message = MIMEMultipart("alternative")
    message["Subject"] = "🎧 Welcome to TrackRepost!"
    message["From"] = SMTP_USERNAME
    message["To"] = email

    text = f"""Hey {name}, welcome to TrackRepost! You're all set to start promoting your music, earning credits, and connecting with new listeners. 🚀
Visit your dashboard to get started: https://www.trackrepost.com/dashboard
Thanks for joining us!
– The TrackRepost Team"""

    html = f"""<html><body>
    <h2>Hey {name}, welcome to <strong>TrackRepost</strong>! 🎉</h2>
    <p>You're all set to start promoting your music, earning credits, and connecting with new listeners.</p>
    <p><a href="https://www.trackrepost.com/dashboard" style="background:#ffaa00;color:black;padding:10px 20px;border-radius:6px;text-decoration:none;">Go to Dashboard</a></p>
    <p>Thanks for joining us!<br>– The TrackRepost Team</p>
    </body></html>"""

    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")
    message.attach(part1)
    message.attach(part2)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_USERNAME, email, message.as_string())
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
