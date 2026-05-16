from sqlmodel import Session, select
from app.models.settings import Settings, StockSettings
from app.schemas.settings import StockSettingsUpdate


class SettingsService:
    @staticmethod
    def get_or_create_settings(session: Session) -> Settings:
        settings = session.exec(select(Settings)).first()
        if not settings:
            settings = Settings(electric_price=2.5, fallback_wattage=200.0)
            session.add(settings)
            session.commit()
            session.refresh(settings)
        return settings

    @staticmethod
    def update_settings(session: Session, data: Settings) -> Settings:
        settings = SettingsService.get_or_create_settings(session)
        settings.electric_price = data.electric_price
        settings.fallback_wattage = data.fallback_wattage
        session.add(settings)
        session.commit()
        session.refresh(settings)
        return settings

    @staticmethod
    def get_or_create_stock_settings(session: Session) -> StockSettings:
        settings = session.exec(select(StockSettings)).first()
        if not settings:
            settings = StockSettings(default_price_per_kg=500.0, default_weight_g=1000.0)
            session.add(settings)
            session.commit()
            session.refresh(settings)
        return settings

    @staticmethod
    def update_stock_settings(session: Session, data: StockSettingsUpdate) -> StockSettings:
        settings = SettingsService.get_or_create_stock_settings(session)
        if data.default_price_per_kg is not None:
            settings.default_price_per_kg = data.default_price_per_kg
        if data.default_weight_g is not None:
            settings.default_weight_g = data.default_weight_g
        session.add(settings)
        session.commit()
        session.refresh(settings)
        return settings
