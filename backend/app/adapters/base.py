from abc import ABC, abstractmethod
from typing import Optional

class DataSourceAdapter(ABC):
    @abstractmethod
    def test_connection(self) -> dict:
        """Test connection and return status dict with 'success' bool and 'message' str."""
        pass

    @abstractmethod
    def get_tables(self) -> list[str]:
        """List available tables."""
        pass

    @abstractmethod
    def preview_data(self, table: str, limit: int = 10) -> list[dict]:
        """Preview table data."""
        pass

    @abstractmethod
    def fetch_table_data(self, table: str) -> list[dict]:
        """Fetch all rows from a table."""
        pass

    @abstractmethod
    def fetch_reference_data(self, filters: Optional[dict] = None, limit: Optional[int] = None) -> list[dict]:
        """Fetch reference businesses for matching."""
        pass
