# import requests
# from bs4 import BeautifulSoup
# import re


# def fetch_indiamart_price(product):
#     """
#     Fetch average market price from IndiaMART.
#     Filters garbage numbers & phone numbers.
#     """

#     try:
#         url = f"https://dir.indiamart.com/search.mp?ss={product.replace(' ', '%20')}"

#         headers = {
#             "User-Agent": "Mozilla/5.0",
#             "Accept-Language": "en-IN,en;q=0.9"
#         }

#         res = requests.get(url, headers=headers, timeout=10)
#         soup = BeautifulSoup(res.text, "html.parser")

#         prices = []

#         # Extract only price-looking text
#         for text in soup.find_all(string=True):

#             if "₹" not in text:
#                 continue

#             # Extract numbers safely
#             match = re.search(r"₹\s?([\d,]+)", text)

#             if not match:
#                 continue

#             price = match.group(1).replace(",", "")

#             if not price.isdigit():
#                 continue

#             price = int(price)

#             # ✅ FILTER OUT garbage numbers
#             if 5000 < price < 20000000:
#                 prices.append(price)

#         if prices:
#             avg_price = sum(prices) // len(prices)
#             print(f"{product} → ₹{avg_price}")
#             return avg_price

#         return None

#     except Exception as e:
#         print("IndiaMART scraping error:", e)
#         return None

from serpapi import GoogleSearch
import re
import os
from dotenv import load_dotenv

load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_KEY")


def fetch_indiamart_price(product):
    """
    Fetch realistic Indian market price using Google Shopping.
    """

    try:
        params = {
            "engine": "google_shopping",
            "q": product,
            "gl": "in",
            "hl": "en",
            "api_key": SERPAPI_KEY
        }

        search = GoogleSearch(params)
        results = search.get_dict()

        items = results.get("shopping_results", [])

        prices = []

        for item in items:
            price_text = item.get("price")
            source = item.get("source", "")

            if not price_text:
                continue

            # prefer Indian sellers
            if any(x in source.lower() for x in ["amazon", "flipkart", "mdcomputers", "primeabgb", "vedant"]):
                price = parse_price(price_text)
                if price:
                    prices.append(price)

        if prices:
            prices.sort()
            median = prices[len(prices)//2]
            print(product, "→ ₹", median)
            return median

        return None

    except Exception as e:
        print("Price error:", e)
        return None


def parse_price(text):
    text = text.replace(",", "")
    nums = re.findall(r"\d+", text)

    if not nums:
        return None

    return int(nums[0])