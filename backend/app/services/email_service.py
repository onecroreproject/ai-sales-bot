import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def _send_smtp_email_sync(to_email: str, subject: str, html_content: str):
    """Synchronous SMTP worker function run in background thread pool."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"\n=======================================================")
        print(f"[EMAIL SIMULATION - SMTP Credentials Not Configured]")
        print(f"TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"CONTENT SUMMARY: Verification email created.")
        print(f"=======================================================\n")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    msg["To"] = to_email

    part = MIMEText(html_content, "html")
    msg.attach(part)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())
        print(f"[EMAIL SENT SUCCESS] Sent verification email to {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL SEND ERROR] Failed to send email to {to_email}: {e}")
        return False


async def send_verification_email(to_email: str, verification_url: str):
    """Asynchronously dispatches email verification message via SMTP or console fallback."""
    subject = "Verify Your Company Email Address - AI Sales Bot Platform"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; }}
        .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .logo {{ display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; line-height: 48px; color: #fff; font-size: 24px; font-weight: bold; margin-bottom: 12px; }}
        .title {{ font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }}
        .text {{ font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }}
        .btn {{ display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff !important; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); }}
        .footer {{ margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🤖</div>
          <h1 class="title">Verify Your Company Account</h1>
        </div>
        <p class="text">
          Thank you for registering your company on <strong>AI Sales Bot Platform</strong>. To activate your account and access your dashboard, please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{verification_url}" class="btn" target="_blank">Verify Email & Activate Dashboard</a>
        </div>
        <p class="text" style="font-size: 12px; color: #64748b;">
          If the button does not work, copy and paste this link into your browser:<br>
          <a href="{verification_url}" style="color: #6366f1;">{verification_url}</a>
        </p>
        <div class="footer">
          &copy; 2026 AI Sales Bot Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

    return await asyncio.to_thread(_send_smtp_email_sync, to_email, subject, html_content)
