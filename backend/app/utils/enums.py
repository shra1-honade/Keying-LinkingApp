import enum


class RunStatus(str, enum.Enum):
    QUEUED = "queued"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ERROR = "error"
    ARCHIVED = "archived"


class SourceType(str, enum.Enum):
    SQLITE = "sqlite"
    SNOWFLAKE = "snowflake"
