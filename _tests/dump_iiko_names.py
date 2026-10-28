import json

with open("_tests/iiko_products_saleable.json") as f:
    iiko_items = json.load(f)

print(f"Total saleable items in iiko: {len(iiko_items)}")

# Print all dishes sorted by name
for p in sorted(iiko_items, key=lambda x: x["name"]):
    print(f"{p['code']:>5} | {p['name']:<45} | {p['defaultSalePrice']:>8} UZS | type: {p['type']}")
