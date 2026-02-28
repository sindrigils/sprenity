from app.main import app


def test_main_app_importable() -> None:
    assert app is not None
