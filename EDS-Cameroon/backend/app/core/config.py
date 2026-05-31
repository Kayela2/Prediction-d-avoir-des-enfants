from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./hearth.db"
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    APP_NAME: str = "Hearth API"
    DEBUG: bool = True
    FRONTEND_URL: str = ""  # URL Vercel en production (ex: https://hearth-edsc.vercel.app)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
