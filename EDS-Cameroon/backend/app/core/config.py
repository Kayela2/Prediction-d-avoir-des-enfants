from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./hearth.db"
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    APP_NAME: str = "Hearth API"
    DEBUG: bool = True
    FRONTEND_URL: str = ""  # URL Render en production (ex: https://hearth-edsc.onrender.com)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
