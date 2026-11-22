class RecipeImportError(Exception):
    """Любая ожидаемая ошибка импорта. У неё есть машинный код и текст для человека."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


class FetchError(RecipeImportError):
    """Не удалось безопасно скачать страницу."""


class ParseError(RecipeImportError):
    """Страница скачана, но рецепта в ней нет."""

    def __init__(self, message: str):
        super().__init__("recipe_not_found", message)
