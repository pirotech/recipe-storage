SAMPLE_RECIPE_HTML = """<!doctype html>
<html><head><title>Блины</title>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Блины на молоке",
  "image": "https://example.com/pancakes.jpg",
  "recipeYield": "4 порции",
  "totalTime": "PT30M",
  "recipeIngredient": ["2 стакана молока", "1 стакан муки", "2 яйца"],
  "recipeInstructions": [
    {"@type": "HowToStep", "text": "Смешать ингредиенты."},
    {"@type": "HowToStep", "text": "Жарить с двух сторон."}
  ]
}
</script></head><body><h1>Блины</h1></body></html>"""

NO_RECIPE_HTML = "<html><head><title>Блог</title></head><body><p>Просто текст</p></body></html>"
