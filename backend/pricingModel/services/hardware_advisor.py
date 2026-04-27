# import requests
# import json

# OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


# def get_hardware_recommendation(vram_required, cpu_cores_required, ram_required, api_key):
#     """
#     Returns hardware advice formatted for the pricing engine.
#     Fully robust & production safe.
#     """

#     payload = {
#         "model": "openai/gpt-4o-mini",
#         "messages": [
#             {
#                 "role": "system",
#                 "content": (
#                     "Return ONLY valid JSON. No markdown. No explanation.\n"
#                     "Use workstation GPUs like NVIDIA RTX series when possible.\n"
#                     "Format:\n"
#                     "{\n"
#                     '  "gpu": {"model": "", "vram_gb": number},\n'
#                     '  "cpu": {"model": "", "cores": number},\n'
#                     '  "ram": {"capacity_gb": number}\n'
#                     "}"
#                 ),
#             },
#             {
#                 "role": "user",
#                 "content": (
#                     f"Recommend one hardware configuration:\n"
#                     f"GPU VRAM >= {vram_required} GB\n"
#                     f"CPU cores >= {cpu_cores_required}\n"
#                     f"RAM >= {ram_required} GB"
#                 ),
#             },
#         ],
#         "temperature": 0,
#         "max_tokens": 200,
#     }

#     headers = {
#         "Authorization": f"Bearer {api_key}",
#         "Content-Type": "application/json",
#     }

#     # ---------- REQUEST WITH RETRY ----------
#     for attempt in range(2):
#         try:
#             response = requests.post(
#                 OPENROUTER_URL,
#                 headers=headers,
#                 json=payload,
#                 timeout=(5, 20), # connect timeout, read timeout
#             )
#             response.raise_for_status()
#             break
#         except requests.exceptions.RequestException as e:
#             if attempt == 1:
#                 print("AI request failed:", e)
#                 return None

#     try:
#         data = response.json()
#         content = data["choices"][0]["message"]["content"]
#     except Exception:
#         print("Invalid AI response structure")
#         return None

#     if not content:
#         return None

#     print("RAW AI RESPONSE:", content)

#     # ---------- REMOVE MARKDOWN ----------
#     def extract_json(text):
#         start = text.find("{")
#         end = text.rfind("}") + 1
#         return text[start:end]

#     try:
#         clean_json = extract_json(content)
#         hw_raw = json.loads(clean_json)
#     except Exception:
#         print("AI returned invalid JSON")
#         return None

#     # ---------- NORMALIZE RESPONSE ----------
#     hw = normalize_hw(hw_raw)
#     print("AI hardware raw response:", hw)

#     if not hw or not hw.get("gpu_model") or not hw.get("cpu_model"):
#         print("AI response missing required fields")
#         return None

#     # ---------- GPU COUNT ----------
#     gpu_vram = hw["gpu_vram"]
#     print(gpu_vram)
#     gpu_count = max(1, (vram_required + gpu_vram - 1) // gpu_vram)
#     ram_capacity = hw["ram_capacity"]
#     cpu_count = max(1, (cpu_cores_required + ram_capacity - 1) // ram_capacity)
#     return {
#         "cpu_recommendation": hw["cpu_model"],
#         "gpu_recommendation": hw["gpu_model"],
#         "gpu_count": gpu_count,
#         "gpu_vram_per_unit": gpu_vram,
#         "total_gpu_vram": gpu_vram * gpu_count,
#         "system_tier": get_system_tier(vram_required),
#         "ram_recommendation":ram_capacity ,
#         "cpu_count" : cpu_count,
#     }


# # ---------- NORMALIZER ----------

# def normalize_hw(hw):
#     """Normalize AI response (handles casing & format variations)."""

#     def lower_keys(obj):
#         return {k.lower(): v for k, v in obj.items()}

#     hw = lower_keys(hw)

#     gpu = hw.get("gpu")
#     cpu = hw.get("cpu")
#     ram = hw.get("ram")

#     if not gpu or not cpu or not ram:
#         return None

#     gpu = lower_keys(gpu)
#     cpu = lower_keys(cpu)

#     # GPU VRAM
#     vram = gpu.get("vram_gb") or gpu.get("vram")
#     if isinstance(vram, str):
#         vram = int(vram.split()[0])

#     # RAM
#     if isinstance(ram, dict):
#         ram = lower_keys(ram)
#         ram_capacity = ram.get("capacity_gb")
#     else:
#         ram_capacity = ram

#     if isinstance(ram_capacity, str):
#         ram_capacity = int(ram_capacity.split()[0])

#     return {
#         "gpu_model": gpu.get("model"),
#         "gpu_vram": vram,
#         "cpu_model": cpu.get("model"),
#         "cpu_cores": cpu.get("cores"),
#         "ram_capacity": ram_capacity,
#     }


# # ---------- SYSTEM TIER ----------

# def get_system_tier(vram):
#     if vram >= 48:
#         return "Enterprise AI"
#     elif vram >= 24:
#         return "Professional AI"
#     else:
#         return "Standard"
import requests
import json

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def get_hardware_recommendation(vram_required, cpu_cores_required, ram_required, api_key):
    """
    Returns AI hardware recommendation with pricing.
    Production safe & fault tolerant.
    """

    payload = {
        "model": "openai/gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": (
                    "Return ONLY valid JSON.\n"
                    "No markdown.\n"
                    "No explanation.\n"
                    "Provide realistic Indian market prices in INR.\n"
                    "Use workstation GPUs when appropriate.\n"
                    "Format:\n"
                    "{\n"
                    '  "gpu": {"model": "", "vram_gb": number, "price_inr": number},\n'
                    '  "cpu": {"model": "", "cores": number, "price_inr": number},\n'
                    '  "ram": {"capacity_gb": number, "price_inr": number}\n'
                    "}"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Recommend one hardware configuration:\n"
                    f"GPU VRAM >= {vram_required} GB\n"
                    f"CPU cores >= {cpu_cores_required}\n"
                    f"RAM >= {ram_required} GB"
                ),
            },
        ],
        "temperature": 0,
        "max_tokens": 200,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    # ---------- CALL AI ----------
    try:
        response = requests.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=(5, 25),
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print("❌ AI request failed:", e)
        return None

    try:
        data = response.json()
        content = data["choices"][0]["message"]["content"]
    except Exception:
        print("❌ Invalid AI response")
        return None

    if not content:
        return None

    print("\n🔹 RAW AI RESPONSE:\n", content)

    # ---------- CLEAN JSON ----------
    def extract_json(text):
        text = text.strip()
        if "```" in text:
            text = text.split("```")[1]
        start = text.find("{")
        end = text.rfind("}") + 1
        return text[start:end]

    try:
        clean_json = extract_json(content)
        hw_raw = json.loads(clean_json)
    except Exception as e:
        print("❌ JSON parse failed:", e)
        return None

    hw = normalize_hw(hw_raw)

    if not hw:
        print("❌ AI response missing fields")
        return None

    print("\n✅ NORMALIZED:", hw)

    # ---------- GPU COUNT ----------
    gpu_vram = hw["gpu_vram"]
    gpu_count = max(1, (vram_required + gpu_vram - 1) // gpu_vram)

    # ---------- CPU COUNT ----------
    cpu_cores_unit = hw["cpu_cores"] or cpu_cores_required
    cpu_count = max(1, (cpu_cores_required + cpu_cores_unit - 1) // cpu_cores_unit)

    # ---------- TOTAL COST ----------
    total_cost = (
        (hw["cpu_price"] or 0) * cpu_count +
        (hw["gpu_price"] or 0) * gpu_count +
        (hw["ram_price"] or 0)
    )

    return {
        "cpu_recommendation": hw["cpu_model"],
        "cpu_price": hw["cpu_price"],
        "cpu_count": cpu_count,

        "gpu_recommendation": hw["gpu_model"],
        "gpu_price": hw["gpu_price"],
        "gpu_count": gpu_count,
        "gpu_vram_per_unit": gpu_vram,
        "total_gpu_vram": gpu_vram * gpu_count,

        "ram_recommendation": hw["ram_capacity"],
        "ram_price": hw["ram_price"],

        "system_tier": get_system_tier(vram_required),

        "estimated_total_cost": total_cost,
    }


# ---------- NORMALIZER ----------

def normalize_hw(hw):
    """Normalize AI response & ensure numeric values."""

    def lower_keys(obj):
        return {k.lower(): v for k, v in obj.items()}

    def to_int(val):
        if val is None:
            return None
        if isinstance(val, int):
            return val
        return int(str(val).replace(",", "").strip())

    hw = lower_keys(hw)

    gpu = lower_keys(hw.get("gpu", {}))
    cpu = lower_keys(hw.get("cpu", {}))
    ram = hw.get("ram")

    if not gpu or not cpu or not ram:
        return None

    # GPU VRAM
    vram = gpu.get("vram_gb") or gpu.get("vram")
    if isinstance(vram, str):
        vram = int(vram.split()[0])

    # RAM capacity
    if isinstance(ram, dict):
        ram = lower_keys(ram)
        ram_capacity = ram.get("capacity_gb")
        ram_price = ram.get("price_inr")
    else:
        ram_capacity = ram
        ram_price = None

    if isinstance(ram_capacity, str):
        ram_capacity = int(ram_capacity.split()[0])

    return {
        "gpu_model": gpu.get("model"),
        "gpu_vram": to_int(vram),
        "gpu_price": to_int(gpu.get("price_inr")),

        "cpu_model": cpu.get("model"),
        "cpu_cores": to_int(cpu.get("cores")),
        "cpu_price": to_int(cpu.get("price_inr")),

        "ram_capacity": to_int(ram_capacity),
        "ram_price": to_int(ram_price),
    }


# ---------- SYSTEM TIER ----------

def get_system_tier(vram):
    if vram >= 48:
        return "Enterprise AI"
    elif vram >= 24:
        return "Professional AI"
    else:
        return "Standard"