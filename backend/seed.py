"""
Seed script for BizMatch - populates database with test data.
Seeds 100K reference businesses for realistic matching performance testing.
"""

import sys
import os
import uuid
import re
import json
import random
from datetime import datetime, timedelta

# Add backend dir to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from faker import Faker
from app.database import engine, SessionLocal, Base, init_db, DB_PATH
from app.models.config import Config
from app.models.run import Run
from app.models.match_result import MatchResult
from app.models.reference_business import ReferenceBusiness
from app.models.user_preferences import UserPreferences
from app.models.customer_business import CustomerBusiness

fake = Faker()
Faker.seed(42)
random.seed(42)

ORG_ID = "demo_org"


def normalize_name(name: str) -> str:
    """Normalize business name for matching."""
    if not name:
        return ""
    name = name.lower().strip()
    name = re.sub(r'[^\w\s]', '', name)
    return re.sub(r'\s+', ' ', name)


def seed_reference_businesses(db, count=100_000):
    """Seed reference businesses table with mock EFX data."""
    print(f"Seeding {count:,} reference businesses...")
    batch_size = 1000
    total = 0

    for batch_start in range(0, count, batch_size):
        businesses = []
        for j in range(batch_size):
            idx = batch_start + j
            if idx >= count:
                break
            name = fake.company()
            businesses.append(ReferenceBusiness(
                client_id=f"EFX{idx:08d}",
                business_name=name,
                normalized_name=normalize_name(name),
                address=fake.street_address(),
                city=fake.city(),
                state=fake.state_abbr(),
                zip=fake.zipcode(),
            ))
        db.add_all(businesses)
        db.commit()
        total += len(businesses)
        if total % 10000 == 0:
            print(f"  ...{total:,} reference businesses seeded")

    print(f"  Seeded {total:,} reference businesses")
    return total


def seed_customer_businesses(db, ref_businesses):
    """Seed customer businesses with realistic variations of reference data.

    Creates a mix that produces varied confidence scores:
    - ~300 close matches (minor formatting differences) → confidence 4-5
    - ~250 moderate variations (name changes, different zip) → confidence 2-3
    - ~150 heavy variations (abbreviations, typos, truncation) → confidence 1-2
    - ~300 completely unmatchable businesses → confidence 0
    """
    print("Seeding customer businesses...")
    businesses = []
    idx = 0

    sampled = random.sample(ref_businesses, min(700, len(ref_businesses)))

    # --- Tier 1: Close matches (~300) — minor formatting, same zip ---
    for ref in sampled[:300]:
        transform = random.choice([
            lambda n: n.upper(),
            lambda n: n.replace(",", "").replace(".", ""),
            lambda n: n,  # exact same name
        ])
        addr = ref.address or fake.street_address()
        businesses.append(CustomerBusiness(
            company_name=transform(ref.business_name),
            account_id=f"CUST{idx:06d}",
            street_address=addr,
            city=ref.city or fake.city(),
            state_code=ref.state or fake.state_abbr(),
            postal_code=ref.zip,  # same zip → higher confidence
        ))
        idx += 1

    # --- Tier 2: Moderate variations (~250) — name changes + different zip ---
    for ref in sampled[300:550]:
        transform = random.choice([
            lambda n: n.replace(" Inc", " Incorporated").replace(" LLC", " Limited Liability Company"),
            lambda n: n.replace("and", "&").replace(",", ""),
            lambda n: "The " + n.split(",")[0].strip(),
            lambda n: n.split(",")[0].strip() + " Company",
            lambda n: n.split()[0] + " " + n.split()[-1] if len(n.split()) > 2 else n,  # drop middle words
        ])
        businesses.append(CustomerBusiness(
            company_name=transform(ref.business_name),
            account_id=f"CUST{idx:06d}",
            street_address=fake.street_address(),  # different address
            city=ref.city or fake.city(),
            state_code=ref.state or fake.state_abbr(),
            postal_code=fake.zipcode(),  # different zip
        ))
        idx += 1

    # --- Tier 3: Heavy variations (~150) — typos, abbreviations, truncation ---
    for ref in sampled[550:700]:
        name = ref.business_name
        transform = random.choice([
            lambda n: n[:len(n)//2],  # truncated name
            lambda n: n.replace("a", "").replace("e", ""),  # drop vowels
            lambda n: n[0] + ". " + " ".join(n.split()[1:]),  # abbreviate first word
            lambda n: "".join(random.choice([c.upper(), c.lower()]) for c in n),  # random case
            lambda n: n + " " + random.choice(["Holdings", "Enterprises", "Global", "Partners"]),
        ])
        businesses.append(CustomerBusiness(
            company_name=transform(name),
            account_id=f"CUST{idx:06d}",
            street_address=fake.street_address(),
            city=fake.city(),  # different city
            state_code=fake.state_abbr(),  # different state
            postal_code=fake.zipcode(),
        ))
        idx += 1

    # --- Tier 4: Unmatchable (~300) — completely unrelated names ---
    unmatchable_patterns = [
        lambda: f"{fake.first_name()}'s {random.choice(['Bakery', 'Garage', 'Deli', 'Salon', 'Workshop'])}",
        lambda: f"{fake.last_name()} {random.choice(['Family Trust', 'Estate', 'Foundation', 'Memorial'])}",
        lambda: f"Project {fake.bothify('??##-####')}",
        lambda: f"{fake.city()} {random.choice(['Municipal', 'County', 'Regional'])} {random.choice(['Water District', 'Fire Dept', 'School Board'])}",
        lambda: f"{fake.first_name()} {fake.last_name()} DBA {fake.bs().title()}",
        lambda: fake.catch_phrase(),
    ]
    for i in range(300):
        pattern = random.choice(unmatchable_patterns)
        businesses.append(CustomerBusiness(
            company_name=pattern(),
            account_id=f"CUST{idx:06d}",
            street_address=fake.street_address(),
            city=fake.city(),
            state_code=fake.state_abbr(),
            postal_code=fake.zipcode(),
        ))
        idx += 1

    random.shuffle(businesses)  # mix them up so results aren't sorted by tier
    db.add_all(businesses)
    db.commit()
    print(f"  Seeded {len(businesses):,} customer businesses")


def seed_configs(db, count=10):
    """Seed configuration table."""
    print(f"Seeding {count} configurations...")
    configs = []
    config_ids = []

    config_names = [
        "Full Reference Match", "West Coast Businesses", "East Coast Clients",
        "Q1 Customer Validation", "Supplier Verification", "Partner Directory Check",
        "Acquisition Targets", "Franchise Validation", "Distributor Audit", "Contractor Registry",
    ]

    # Configs point to customer_businesses with cross-table column mapping
    # Keys = EFX reference column names, Values = customer table column names
    column_mapping = {
        "business_name": "company_name",
        "client_id": "account_id",
        "address": "street_address",
        "city": "city",
        "state": "state_code",
        "zip": "postal_code",
    }

    for i in range(count):
        config_id = str(uuid.uuid4())
        config_ids.append(config_id)
        configs.append(Config(
            config_id=config_id,
            org_id=ORG_ID,
            name=config_names[i],
            source_type="sqlite",
            source_table="customer_businesses",
            column_mapping=column_mapping,
            run_count=random.randint(0, 5),
        ))

    db.add_all(configs)
    db.commit()
    print(f"  Seeded {count} configurations")
    return config_ids


def seed_runs_and_results(db, config_ids, runs_per_config=2):
    """Seed runs and match results."""
    total_runs = len(config_ids) * runs_per_config
    print(f"Seeding {total_runs} runs with match results...")

    statuses = ["completed", "completed", "completed", "error", "in_progress"]
    run_count = 0

    for config_id in config_ids:
        for _ in range(runs_per_config):
            run_id = str(uuid.uuid4())
            status = random.choice(statuses)

            if status == "completed":
                input_count = random.randint(100, 500)
                matched_count = random.randint(int(input_count * 0.5), int(input_count * 0.9))
                match_rate = round((matched_count / input_count) * 100, 1)
                avg_confidence = round(random.uniform(2.5, 4.5), 1)
                started_at = datetime.utcnow() - timedelta(hours=random.randint(1, 168))
                duration = random.uniform(5, 120)
                completed_at = started_at + timedelta(seconds=duration)
            elif status == "error":
                input_count = random.randint(50, 200)
                matched_count = 0
                match_rate = 0.0
                avg_confidence = None
                started_at = datetime.utcnow() - timedelta(hours=random.randint(1, 48))
                duration = random.uniform(1, 10)
                completed_at = started_at + timedelta(seconds=duration)
            else:  # in_progress
                input_count = random.randint(100, 300)
                matched_count = random.randint(0, int(input_count * 0.3))
                match_rate = round((matched_count / input_count) * 100, 1) if input_count else 0.0
                avg_confidence = round(random.uniform(1.0, 3.0), 1) if matched_count else None
                started_at = datetime.utcnow() - timedelta(minutes=random.randint(1, 15))
                duration = None
                completed_at = None

            run = Run(
                run_id=run_id,
                config_id=config_id,
                org_id=ORG_ID,
                status=status,
                input_count=input_count,
                matched_count=matched_count,
                match_rate=match_rate,
                avg_confidence=avg_confidence,
                error_message="Connection timeout: unable to reach data source" if status == "error" else None,
                duration_seconds=round(duration, 2) if duration else None,
                started_at=started_at,
                completed_at=completed_at,
            )
            db.add(run)
            db.flush()

            # Seed match results for completed runs
            if status == "completed":
                seed_match_results_for_run(db, run_id, input_count, matched_count)

            run_count += 1

    db.commit()
    print(f"  Seeded {run_count} runs")


def seed_match_results_for_run(db, run_id, input_count, matched_count):
    """Seed match results for a single run."""
    results = []
    unmatched_remaining = input_count - matched_count

    for i in range(input_count):
        result_id = str(uuid.uuid4())
        is_matched = i < matched_count

        if is_matched:
            confidence = random.choices([5, 4, 3, 2, 1], weights=[15, 30, 30, 15, 10])[0]
            name_sim = {5: random.uniform(95, 100), 4: random.uniform(85, 95), 3: random.uniform(75, 85), 2: random.uniform(65, 75), 1: random.uniform(50, 65)}[confidence]
            addr_sim = random.uniform(60, 100) if confidence >= 4 else random.uniform(20, 70)

            reasons = {
                5: f"Definitive match: name {name_sim:.0f}%, zip match, address {addr_sim:.0f}%",
                4: f"High confidence: name {name_sim:.0f}%, zip match",
                3: f"Probable match: name {name_sim:.0f}%",
                2: f"Possible match: name {name_sim:.0f}%",
                1: f"Low confidence: name {name_sim:.0f}%",
            }

            matched_name = fake.company()
            results.append(MatchResult(
                result_id=result_id,
                run_id=run_id,
                client_id=f"CLT-{run_id[:8]}-{i+1:04d}",
                input_business_name=fake.company(),
                input_address=fake.street_address(),
                input_city=fake.city(),
                input_state=fake.state_abbr(),
                input_zip=fake.zipcode(),
                matched_efx_business=matched_name,
                efx_id=f"EFX{random.randint(0, 99999):08d}",
                efx_address=fake.street_address(),
                efx_city=fake.city(),
                efx_state=fake.state_abbr(),
                efx_zip=fake.zipcode(),
                confidence_score=confidence,
                name_similarity=round(name_sim, 1),
                address_similarity=round(addr_sim, 1),
                match_reason=reasons[confidence],
                flagged_for_review=confidence <= 2 and random.random() < 0.3,
            ))
        else:
            results.append(MatchResult(
                result_id=result_id,
                run_id=run_id,
                client_id=f"CLT-{run_id[:8]}-{i+1:04d}",
                input_business_name=fake.company(),
                input_address=fake.street_address(),
                input_city=fake.city(),
                input_state=fake.state_abbr(),
                input_zip=fake.zipcode(),
                confidence_score=0,
                name_similarity=round(random.uniform(10, 49), 1),
                address_similarity=0.0,
                match_reason="No match found - name similarity below threshold",
            ))

        # Batch commit every 100
        if len(results) >= 100:
            db.add_all(results)
            db.flush()
            results = []

    if results:
        db.add_all(results)
        db.flush()


def seed_preferences(db):
    """Seed default user preferences."""
    print("Seeding user preferences...")
    prefs = UserPreferences(
        org_id=ORG_ID,
        email_notifications=True,
        notify_on_completion=True,
        notify_on_error=True,
        retention_days=90,
        auto_archive=False,
        default_page_size=25,
    )
    db.add(prefs)
    db.commit()
    print("  Seeded default preferences")


def main():
    """Main seed function."""
    print("=" * 60)
    print("BizMatch Database Seeder v2.0")
    print("=" * 60)

    # Delete existing database
    for ext in ["", "-wal", "-shm"]:
        p = DB_PATH + ext
        if os.path.exists(p):
            os.remove(p)
    print(f"Removed existing database: {DB_PATH}")

    # Initialize database
    print("\nInitializing database schema...")
    init_db()

    db = SessionLocal()
    try:
        # Seed data
        ref_count = seed_reference_businesses(db, count=100_000)

        # Fetch a sample of reference businesses for deriving customer data
        ref_sample = db.query(ReferenceBusiness).limit(1000).all()
        seed_customer_businesses(db, ref_sample)

        config_ids = seed_configs(db, count=10)
        seed_runs_and_results(db, config_ids, runs_per_config=2)
        seed_preferences(db)

        # Print summary
        print("\n" + "=" * 60)
        print("Database seeded successfully!")
        print("=" * 60)
        print(f"\nSummary:")
        print(f"  Reference Businesses: {db.query(ReferenceBusiness).count():,}")
        print(f"  Customer Businesses:  {db.query(CustomerBusiness).count():,}")
        print(f"  Configurations:       {db.query(Config).count()}")
        print(f"  Runs:                 {db.query(Run).count()}")
        print(f"  Match Results:        {db.query(MatchResult).count():,}")
        print(f"  User Preferences:     {db.query(UserPreferences).count()}")

    except Exception as e:
        db.rollback()
        print(f"\nError seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
