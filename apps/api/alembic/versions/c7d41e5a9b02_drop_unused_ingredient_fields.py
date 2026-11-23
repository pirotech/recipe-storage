"""drop unused ingredient fields

Убирает из каждого ингредиента в recipes.ingredients ключи name, amount и unit.
Парсер их никогда не заполнял (везде были null), а количество теперь разбирается
на фронте из строки raw.

Revision ID: c7d41e5a9b02
Revises: 2b605ce270d0
Create Date: 2026-11-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'c7d41e5a9b02'
down_revision: Union[str, Sequence[str], None] = '2b605ce270d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        """
        UPDATE recipes
        SET ingredients = COALESCE(
            (
                SELECT jsonb_agg(elem - 'name' - 'amount' - 'unit' ORDER BY ord)
                FROM jsonb_array_elements(ingredients) WITH ORDINALITY AS t(elem, ord)
            ),
            '[]'::jsonb
        )
        WHERE jsonb_typeof(ingredients) = 'array'
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Удалённые ключи везде были null и ничего не несли, восстанавливать нечего.
    pass
