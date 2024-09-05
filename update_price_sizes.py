import json
with open("prices.json", "r") as infile:
    data = json.load(infile)
    updated_data = []
    for item in data:
        size = item["size"].split(" x ")
        item["width"] = float(size[0])
        item["height"] = float(size[1])
        del item["size"]
        updated_data.append(item)

with open("updated_prices.json", "w") as outfile:
    json.dump(updated_data, outfile, indent=4)
    print("updated_prices.json has been created.")
