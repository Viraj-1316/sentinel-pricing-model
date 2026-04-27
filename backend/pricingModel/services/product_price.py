import requests
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("RAPIDAPI_KEY")


def fetch_price(product_name):
    """
    Returns price of exact product if found,
    otherwise best match.
    """

    url = "https://real-time-amazon-data.p.rapidapi.com/search"

    headers = {
        "X-RapidAPI-Key": API_KEY,
        "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
    }

    params = {
        "query": product_name,
        "country": "IN"
    }

    try:
        response = requests.get(url, headers=headers, params=params, timeout=8)
        response.raise_for_status()
        data = response.json()

        products = data.get("data", {}).get("products", [])
        if not products:
            return None

        # ---------- STEP 1: Try EXACT MATCH ----------
        product_name_lower = product_name.lower()

        for product in products:
            title = product.get("product_title", "").lower()

            if product_name_lower in title and "refurbished" not in title:
                return parse_price(product.get("product_price"))

        # ---------- STEP 2: Try PARTIAL MATCH ----------
        keywords = product_name_lower.split()

        for product in products:
            title = product.get("product_title", "").lower()

            if all(word in title for word in keywords[:2]):  # match main words
                return parse_price(product.get("product_price"))

        # ---------- STEP 3: Fallback to first valid price ----------
        for product in products:
            price = parse_price(product.get("product_price"))
            if price:
                return price

        return None

    except requests.exceptions.RequestException as e:
        print("Price API error:", e)
        return None


def parse_price(price_str):
    """Safely convert ₹ price string to int."""
    if not price_str:
        return None

    try:
        cleaned = (
            price_str.replace("₹", "")
            .replace(",", "")
            .strip()
        )
        return int(cleaned)
    except:
        return None

# import os
# from serpapi import GoogleSearch
# from dotenv import load_dotenv

# load_dotenv()
# SERPAPI_KEY = os.getenv("SERPAPI_KEY")

# INVALID_WORDS = [
#     "refurbished", "renewed", "used",
#     "cooler", "fan", "heatsink",
#     "bracket", "cover", "case",
#     "motherboard", "bundle", "combo",
#     "laptop", "adapter", "cable"
# ]


# def fetch_price(product_name):
#     """
#     Fetch accurate product price using Google Shopping.
#     Returns None if no valid listing found.
#     """

#     params = {
#         "engine": "google_shopping",
#         "q": product_name,
#         "gl": "in",
#         "hl": "en",
#         "api_key": SERPAPI_KEY
#     }

#     try:
#         search = GoogleSearch(params)
#         results = search.get_dict()
#         items = results.get("shopping_results", [])

#         if not items:
#             return None

#         product_name_lower = product_name.lower()
#         keywords = product_name_lower.split()

#         for item in items:
#             title = item.get("title", "").lower()

#             # skip invalid listings
#             if any(word in title for word in INVALID_WORDS):
#                 continue

#             # ensure key words match
#             if not all(word in title for word in keywords[:2]):
#                 continue

#             price = parse_price(item.get("price"))

#             # reject unrealistic prices
#             if price and price > 5000:
#                 return price

#         return None

#     except Exception as e:
#         print("Google price error:", e)
#         return None


# def parse_price(price_str):
#     """Convert ₹ price string to integer safely."""
#     if not price_str:
#         return None

#     try:
#         cleaned = (
#             price_str.replace("₹", "")
#             .replace(",", "")
#             .replace(".00", "")
#             .strip()
#         )
#         return int(cleaned)
#     except:
#         return None