import json
import re

with open("data/menu.json") as f:
    menu = json.load(f)

with open("_tests/iiko_products_saleable.json") as f:
    iiko_items = json.load(f)

def normalize(s):
    s = s.lower().strip()
    s = re.sub(r'[«»"\'\(\)\-]', ' ', s)
    s = s.replace('ё', 'е')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

iiko_norm = {normalize(p["name"]): p for p in iiko_items}

matched = 0
unmatched = []
diff_prices = []

menu_items = []
for sec_key in ["food", "drinks"]:
    for cat in menu["sections"][sec_key]:
        for it in cat["items"]:
            menu_items.append((sec_key, cat["name"]["ru"], it))

for sec, cat_name, it in menu_items:
    name_ru = it["name"]["ru"]
    norm = normalize(name_ru)
    
    # Try exact match
    p = iiko_norm.get(norm)
    
    # Specific common remappings
    if not p:
        for ik_norm, ik_p in iiko_norm.items():
            if norm == ik_norm:
                p = ik_p
                break
    
    # Try substring
    if not p:
        for ik_norm, ik_p in iiko_norm.items():
            # if either is a complete word prefix or contains
            if norm in ik_norm or ik_norm in norm:
                # check similarity
                p = ik_p
                break
    
    if p:
        matched += 1
        iiko_price = p["defaultSalePrice"]
        curr_price = it.get("price")
        if curr_price != iiko_price:
            diff_prices.append((name_ru, p["name"], curr_price, iiko_price))
    else:
        unmatched.append((cat_name, name_ru, it.get("price")))

print(f"Total menu items: {len(menu_items)}")
print(f"Matched with iiko: {matched}")
print(f"Unmatched: {len(unmatched)}")
print(f"Price differences found: {len(diff_prices)}")

if diff_prices:
    print("\n--- Price differences: ---")
    for m_name, ik_name, old_p, new_p in diff_prices:
        print(f"  {m_name} (iiko: {ik_name}): {old_p} -> {new_p}")

if unmatched:
    print(f"\n--- Unmatched items ({len(unmatched)}): ---")
    for cat_name, m_name, p in unmatched:
        print(f"  [{cat_name}] {m_name} ({p})")
