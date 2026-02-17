"""
BizMatch Matching Engine
Uses rapidfuzz for fuzzy string matching with 5-level confidence scoring.
"""

import re
from rapidfuzz import fuzz, process
from app.adapters.base import DataSourceAdapter


class MatchingEngine:
    def __init__(self, adapter: DataSourceAdapter):
        self.adapter = adapter
        self.reference_data: list[dict] = []
        self.name_index: dict[str, dict] = {}

    def load_reference_data(self, limit: int = 10_000):
        """Load reference businesses into memory with normalized name index."""
        self.reference_data = self.adapter.fetch_reference_data(limit=limit)
        self.name_index = {}
        for r in self.reference_data:
            normalized = self._normalize(r["business_name"])
            self.name_index[normalized] = r
        # Pre-compute list of names for process.extract (avoids repeated dict_keys iteration)
        self._name_choices = list(self.name_index.keys())

    @staticmethod
    def _normalize(text: str) -> str:
        """Normalize: lowercase, strip, remove punctuation."""
        if not text:
            return ""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s]', '', text)
        return re.sub(r'\s+', ' ', text)

    def match_business(self, input_record: dict) -> dict:
        """Match a single business record against reference data."""
        input_name = self._normalize(input_record.get("business_name", ""))
        input_zip = input_record.get("zip") or input_record.get("input_zip")
        input_address = input_record.get("address") or input_record.get("input_address")

        if not input_name or not self.name_index:
            return {
                "confidence_score": 0,
                "name_similarity": 0.0,
                "address_similarity": 0.0,
                "match_reason": "No match found",
            }

        # Fuzzy match on business name - get top 5 candidates above 45% similarity
        matches = process.extract(
            input_name,
            self._name_choices,
            scorer=fuzz.token_sort_ratio,
            limit=5,
            score_cutoff=45,
        )

        best_match = None
        best_confidence = 0

        for match_name, name_score, _ in matches:
            ref = self.name_index[match_name]

            # Check zip match
            zip_match = bool(input_zip and ref.get("zip") and input_zip == ref["zip"])

            # Calculate address similarity
            address_score = 0.0
            if input_address and ref.get("address"):
                address_score = fuzz.ratio(
                    self._normalize(input_address),
                    self._normalize(ref["address"]),
                )

            # Calculate confidence level (0-5)
            confidence = self._calculate_confidence(name_score, zip_match, address_score)

            if confidence > best_confidence:
                best_confidence = confidence
                best_match = {
                    "matched_efx_business": ref["business_name"],
                    "efx_id": ref["client_id"],
                    "efx_address": ref.get("address"),
                    "efx_city": ref.get("city"),
                    "efx_state": ref.get("state"),
                    "efx_zip": ref.get("zip"),
                    "confidence_score": confidence,
                    "name_similarity": round(name_score, 1),
                    "address_similarity": round(address_score, 1),
                    "match_reason": self._generate_reason(confidence, name_score, zip_match, address_score),
                }

        if best_match and best_match["confidence_score"] > 0:
            return best_match

        return {
            "confidence_score": 0,
            "name_similarity": 0.0,
            "address_similarity": 0.0,
            "match_reason": "No match found - name similarity below threshold",
        }

    @staticmethod
    def _calculate_confidence(name_score: float, zip_match: bool, address_score: float) -> int:
        """
        5-level confidence scoring:
        5 (Definitive): Name >= 95%, Zip match, Address >= 80%
        4 (High):       Name >= 85%, Zip match
        3 (Probable):   Name >= 80% + Zip match OR Name >= 95% alone
        2 (Possible):   Name >= 70%
        1 (Low):        Name >= 60%
        0 (No Match):   Name < 60%
        """
        if name_score >= 95 and zip_match and address_score >= 80:
            return 5
        elif name_score >= 85 and zip_match:
            return 4
        elif (name_score >= 80 and zip_match) or name_score >= 95:
            return 3
        elif name_score >= 70:
            return 2
        elif name_score >= 60:
            return 1
        else:
            return 0

    @staticmethod
    def _generate_reason(confidence: int, name_score: float, zip_match: bool, address_score: float) -> str:
        """Generate human-readable match reason."""
        reasons = {
            5: f"Definitive match: name {name_score:.0f}%, zip match, address {address_score:.0f}%",
            4: f"High confidence: name {name_score:.0f}%, zip match",
            3: f"Probable match: name {name_score:.0f}%"
               + (", zip match" if zip_match else ""),
            2: f"Possible match: name {name_score:.0f}%",
            1: f"Low confidence: name {name_score:.0f}%",
            0: "No match found",
        }
        return reasons.get(confidence, "No match found")
