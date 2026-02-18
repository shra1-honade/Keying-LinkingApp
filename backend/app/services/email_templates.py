"""Professional HTML email templates for BizMatch notifications."""


def _base_layout(content: str) -> str:
    """Wrap content in the standard BizMatch email layout."""
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background-color:#003087;padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">BizMatch</td>
                <td align="right" style="color:rgba(255,255,255,0.7);font-size:12px;">Equifax Business Matching</td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            {content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#9ca3af;font-size:11px;">This is an automated notification from BizMatch.</td>
                <td align="right" style="color:#9ca3af;font-size:11px;">Manage in Settings &rarr; Preferences</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _stat_row(label: str, value: str, is_last: bool = False) -> str:
    border = "" if is_last else "border-bottom:1px solid #f3f4f6;"
    return f"""\
<tr>
  <td style="padding:12px 16px;{border}color:#6b7280;font-size:13px;width:160px;">{label}</td>
  <td style="padding:12px 16px;{border}color:#111827;font-size:14px;font-weight:600;">{value}</td>
</tr>"""


def run_completed_email(run) -> str:
    """Build HTML for a successful run completion notification."""
    # Match rate color
    rate = run.match_rate or 0
    if rate >= 80:
        rate_color = "#059669"
        rate_bg = "#ecfdf5"
    elif rate >= 50:
        rate_color = "#d97706"
        rate_bg = "#fffbeb"
    else:
        rate_color = "#dc2626"
        rate_bg = "#fef2f2"

    content = f"""\
<!-- Status Badge -->
<table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    <td style="background-color:#ecfdf5;color:#059669;font-size:12px;font-weight:600;padding:4px 12px;border-radius:12px;text-transform:uppercase;letter-spacing:0.5px;">
      Completed
    </td>
  </tr>
</table>

<h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">Run Finished Successfully</h2>
<p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Your matching job has completed processing. Here are the results:</p>

<!-- Match Rate Highlight -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:{rate_bg};border-radius:8px;margin-bottom:24px;">
  <tr>
    <td style="padding:20px;text-align:center;">
      <div style="color:{rate_color};font-size:36px;font-weight:800;line-height:1;">{rate}%</div>
      <div style="color:{rate_color};font-size:13px;margin-top:4px;font-weight:500;">Match Rate</div>
    </td>
  </tr>
</table>

<!-- Stats Table -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
  {_stat_row("Run ID", f'<code style="background:#e5e7eb;padding:2px 6px;border-radius:4px;font-size:12px;">{run.run_id[:8]}</code>')}
  {_stat_row("Records Processed", f"{run.input_count:,}")}
  {_stat_row("Records Matched", f"{run.matched_count:,}")}
  {_stat_row("Avg. Confidence", f"{run.avg_confidence}/5" if run.avg_confidence else "N/A")}
  {_stat_row("Duration", f"{run.duration_seconds}s", is_last=True)}
</table>"""

    return _base_layout(content)


def run_error_email(run) -> str:
    """Build HTML for a run failure notification."""
    error_msg = run.error_message or "An unknown error occurred during processing."

    content = f"""\
<!-- Status Badge -->
<table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    <td style="background-color:#fef2f2;color:#dc2626;font-size:12px;font-weight:600;padding:4px 12px;border-radius:12px;text-transform:uppercase;letter-spacing:0.5px;">
      Failed
    </td>
  </tr>
</table>

<h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">Run Failed</h2>
<p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Your matching job encountered an error and could not complete.</p>

<!-- Error Box -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:24px;">
  <tr>
    <td style="padding:16px;">
      <div style="color:#991b1b;font-size:12px;font-weight:600;text-transform:uppercase;margin-bottom:6px;">Error Details</div>
      <div style="color:#dc2626;font-size:14px;line-height:1.5;">{error_msg}</div>
    </td>
  </tr>
</table>

<!-- Run Info -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
  {_stat_row("Run ID", f'<code style="background:#e5e7eb;padding:2px 6px;border-radius:4px;font-size:12px;">{run.run_id[:8]}</code>', is_last=True)}
</table>"""

    return _base_layout(content)


def test_email() -> str:
    """Build HTML for a test/verification email."""
    content = """\
<!-- Status Badge -->
<table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    <td style="background-color:#eff6ff;color:#2563eb;font-size:12px;font-weight:600;padding:4px 12px;border-radius:12px;text-transform:uppercase;letter-spacing:0.5px;">
      Test Email
    </td>
  </tr>
</table>

<h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">Email Configured Successfully</h2>
<p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Your email notifications are set up and working correctly.</p>

<!-- Confirmation Box -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;margin-bottom:24px;">
  <tr>
    <td style="padding:20px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">&#10003;</div>
      <div style="color:#059669;font-size:15px;font-weight:600;">SMTP Connection Verified</div>
      <div style="color:#6b7280;font-size:13px;margin-top:4px;">You will receive notifications based on your preference settings.</div>
    </td>
  </tr>
</table>

<!-- What you'll receive -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
  <tr>
    <td style="padding:16px;">
      <div style="color:#374151;font-size:13px;font-weight:600;margin-bottom:8px;">You can receive notifications for:</div>
      <div style="color:#6b7280;font-size:13px;line-height:1.8;">
        &bull; Run completed successfully (with match rate &amp; stats)<br>
        &bull; Run failed (with error details)
      </div>
    </td>
  </tr>
</table>"""

    return _base_layout(content)
