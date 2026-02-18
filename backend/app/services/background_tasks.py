"""Background task processing for long-running matching jobs."""

import threading
from datetime import datetime
from app.database import SessionLocal
from app.models.run import Run
from app.models.config import Config
from app.models.match_result import MatchResult
from app.models.user_preferences import UserPreferences
from app.adapters.sqlite_adapter import SQLiteAdapter
from app.services.matching_engine import MatchingEngine
from app.services.audit_service import log_event
from app.services.email_service import send_email, is_configured as email_configured
from app.services.email_templates import run_completed_email, run_error_email


def _send_run_notification(db, org_id: str, run, status: str):
    """Send email notification for run completion/error if user has opted in."""
    try:
        if not email_configured():
            return

        prefs = db.query(UserPreferences).filter(
            UserPreferences.org_id == org_id
        ).first()

        if not prefs or not prefs.email_notifications or not prefs.notification_email:
            return

        if status == "completed" and not prefs.notify_on_completion:
            return
        if status == "error" and not prefs.notify_on_error:
            return

        if status == "completed":
            subject = f"BizMatch - Run Completed ({run.match_rate}% match rate)"
            html_body = run_completed_email(run)
        else:
            subject = "BizMatch - Run Failed"
            html_body = run_error_email(run)

        send_email(
            to_email=prefs.notification_email,
            subject=subject,
            html_body=html_body,
        )

        log_event(db, org_id, "notification_sent", run_id=run.run_id, payload={
            "type": status,
            "email": prefs.notification_email,
        })
        db.commit()

    except Exception as e:
        # Never let notification failure break the run
        print(f"[WARN] Failed to send notification: {e}")


def run_matching_job(run_id: str, config_id: str, org_id: str):
    """Execute matching job in a background thread."""

    def job():
        db = SessionLocal()
        try:
            run = db.query(Run).filter(Run.run_id == run_id).first()
            if not run:
                return

            run.status = "in_progress"
            run.started_at = datetime.utcnow()
            db.commit()

            log_event(db, org_id, "run_started", run_id=run_id)
            db.commit()

            # Load config
            config = db.query(Config).filter(Config.config_id == config_id).first()
            if not config:
                run.status = "error"
                run.error_message = "Configuration not found"
                db.commit()
                return

            # Initialize matching engine
            adapter = SQLiteAdapter(db)
            engine = MatchingEngine(adapter)
            engine.load_reference_data()

            # Fetch real source data using the config's table and column mapping
            source_table = config.source_table
            column_mapping = config.column_mapping or {}

            raw_rows = adapter.fetch_table_data(source_table)
            if not raw_rows:
                run.status = "error"
                run.error_message = f"No data found in source table '{source_table}'"
                db.commit()
                return

            # Remap columns: mapping is {efx_field: source_col}
            input_records = []
            for row in raw_rows:
                remapped = {}
                for efx_field, source_col in column_mapping.items():
                    remapped[efx_field] = row.get(source_col, "")
                input_records.append(remapped)

            # Process matches
            matched_count = 0
            total_confidence = 0
            start_time = datetime.utcnow()

            for i, record in enumerate(input_records):
                match_result = engine.match_business(record)

                db_result = MatchResult(
                    run_id=run_id,
                    client_id=record.get("client_id", f"ROW-{i+1}"),
                    input_business_name=record.get("business_name", ""),
                    input_address=record.get("address"),
                    input_city=record.get("city"),
                    input_state=record.get("state"),
                    input_zip=record.get("zip"),
                    matched_efx_business=match_result.get("matched_efx_business"),
                    efx_id=match_result.get("efx_id"),
                    efx_address=match_result.get("efx_address"),
                    efx_city=match_result.get("efx_city"),
                    efx_state=match_result.get("efx_state"),
                    efx_zip=match_result.get("efx_zip"),
                    confidence_score=match_result["confidence_score"],
                    name_similarity=match_result.get("name_similarity"),
                    address_similarity=match_result.get("address_similarity"),
                    match_reason=match_result.get("match_reason"),
                )
                db.add(db_result)

                if match_result["confidence_score"] > 0:
                    matched_count += 1
                    total_confidence += match_result["confidence_score"]

                # Commit every 50 records for progress updates
                if (i + 1) % 50 == 0:
                    run.matched_count = matched_count
                    run.input_count = i + 1
                    db.commit()

            # Finalize
            end_time = datetime.utcnow()
            run.status = "completed"
            run.input_count = len(input_records)
            run.matched_count = matched_count
            run.match_rate = round((matched_count / len(input_records)) * 100, 1) if input_records else 0
            run.avg_confidence = round(total_confidence / matched_count, 1) if matched_count > 0 else 0
            run.duration_seconds = round((end_time - start_time).total_seconds(), 1)
            run.completed_at = end_time

            # Update config run count
            config.run_count = (config.run_count or 0) + 1

            log_event(db, org_id, "run_completed", run_id=run_id, payload={
                "input_count": run.input_count,
                "matched_count": run.matched_count,
                "match_rate": run.match_rate,
            })
            db.commit()

            _send_run_notification(db, org_id, run, "completed")

        except Exception as e:
            db.rollback()
            try:
                run = db.query(Run).filter(Run.run_id == run_id).first()
                if run:
                    run.status = "error"
                    run.error_message = str(e)[:500]
                    db.commit()
                    _send_run_notification(db, org_id, run, "error")
            except Exception:
                pass
        finally:
            db.close()

    thread = threading.Thread(target=job, daemon=True)
    thread.start()
