import os
import requests
import markdown as _md


def _cfg():
    return (
        os.environ.get("EMAIL_BACKEND", "console"),          # console | resend
        os.environ.get("EMAIL_FROM", "StatTips <onboarding@resend.dev>"),
        os.environ.get("RESEND_API_KEY", ""),
    )


def send_email(to, subject, body, html=None):
    if not to:
        return False
    backend, sender, key = _cfg()
    try:
        if backend == "resend" and key:
            payload = {"from": sender, "to": [to], "subject": subject, "text": body}
            if html:
                payload["html"] = html
            r = requests.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json=payload, timeout=8,
            )
            r.raise_for_status()
            return True
        print("\n----- EMAIL (console backend) -----")
        print(f"To: {to}\nSubject: {subject}\n\n{body}\n----- END EMAIL -----\n")
        return True
    except Exception as e:
        print(f"[email] non-blocking send failure: {e}")
        return False


def _shell(heading, subtitle, inner):
    return (
        '<div style="max-width:560px;margin:0 auto;padding:24px;'
        'font-family:-apple-system,Segoe UI,Roboto,sans-serif;">'
        '<div style="height:4px;border-radius:2px;background:linear-gradient('
        '90deg,#007749 25%,#ffb81c 25% 50%,#e03c31 50% 75%,#001489 75%);"></div>'
        '<div style="background:#fff;border:1px solid #e6eaf0;border-radius:14px;'
        'padding:28px;margin-top:16px;">'
        '<h2 style="color:#007749;margin:0 0 4px;font-size:18px;">Statistics South Africa</h2>'
        f'<p style="color:#5b6675;font-size:13px;margin:0 0 20px;">{subtitle}</p>'
        f'{inner}</div>'
        '<p style="color:#8a94a3;font-size:11px;text-align:center;margin:16px 0 0;line-height:1.5;">'
        'Independent prototype for the GovTech 2026 Hackathon — not an official Statistics South Africa product.</p>'
        '</div>'
    )


def _enquiry_block(question):
    return (
        '<p style="color:#333;font-size:14px;margin:0 0 6px;"><strong>Your enquiry</strong></p>'
        f'<p style="color:#555;font-size:14px;font-style:italic;margin:0 0 20px;">&ldquo;{question}&rdquo;</p>'
    )


def confirmation_email_html(question):
    inner = _enquiry_block(question) + (
        '<div style="border-top:1px solid #eee;padding-top:20px;color:#14181f;font-size:15px;line-height:1.6;">'
        'Thank you — your enquiry has been received and logged for review. A communications official will '
        'review a source-checked response and reply to you directly. Media responses are reviewed by a human '
        'before release.</div>'
    )
    return _shell("Received", "Media enquiry received", inner)


def response_email_html(question, response_text):
    body_html = _md.markdown(response_text)   # ## -> <h2>, ** -> <strong>, etc.
    inner = _enquiry_block(question) + (
        '<div style="border-top:1px solid #eee;padding-top:20px;color:#14181f;'
        f'font-size:15px;line-height:1.6;">{body_html}</div>'
    )
    return _shell("Response", "Response to your media enquiry", inner)


def rejection_email_html(question, reason):
    inner = _enquiry_block(question) + (
        '<div style="border-top:1px solid #eee;padding-top:20px;color:#14181f;font-size:15px;line-height:1.6;">'
        'After review, we\'re unable to provide an official response at this time.'
        f'<div style="background:#fdf3f2;border:1px solid #f6d5d2;border-radius:10px;padding:12px 14px;margin:14px 0;'
        f'color:#8a2b23;font-size:14px;"><strong>Reason:</strong> {reason}</div>'
        'You\'re welcome to rephrase your enquiry or contact the media desk directly.</div>'
    )
    return _shell("Update", "Update on your media enquiry", inner)