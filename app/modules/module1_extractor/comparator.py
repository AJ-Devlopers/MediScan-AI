from .range_service import get_normal_range


def compare_values(data):
    results = []

    for item in data:
        name = item.get("name", "")
        value = item.get("value")

        # 🔥 SAFE VALUE CONVERSION
        try:
            value = float(value)
        except:
            value = None

        # 🔥 GET RANGE
        range_data = get_normal_range(name)

        low = range_data.get("low")
        high = range_data.get("high")
        unit = range_data.get("unit")   # ✅ NEW (optional but useful)

        # 🔥 STATUS LOGIC
        if value is None:
            status = "UNKNOWN"

        elif low is None or high is None:
            status = "UNKNOWN"

        else:
            try:
                if value < low:
                    status = "LOW"
                elif value > high:
                    status = "HIGH"
                else:
                    status = "NORMAL"
            except:
                status = "UNKNOWN"

        # 🔥 FINAL OUTPUT
        results.append({
            **item,
            "value": value,
            "status": status,
            "normal_range": {
                "low": low,
                "high": high,
                "unit": unit   # ✅ included in response
            }
        })

    return results