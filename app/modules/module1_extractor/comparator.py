from .range_service import get_normal_range


def format_range(low, high, unit):
    if low is None or high is None:
        return "N/A"

    if unit:
        return f"{low} - {high} {unit}"
    return f"{low} - {high}"


def compare_values(data):
    results = []

    for item in data:
        name = item.get("name", "")
        value = item.get("value")

        try:
            value = float(value)
        except:
            value = None

        range_data = get_normal_range(name)

        low = range_data.get("low")
        high = range_data.get("high")

        # 🔥 priority fix
        unit = item.get("unit") or range_data.get("unit")

        # 🔥 NEW
        formatted_range = format_range(low, high, unit)

        # status logic...
        if value is None or low is None or high is None:
            status = "UNKNOWN"
        elif value < low:
            status = "LOW"
        elif value > high:
            status = "HIGH"
        else:
            status = "NORMAL"

        results.append({
            **item,
            "value": value,
            "status": status,
            "normal_range": {
                "low": low,
                "high": high,
                "unit": unit,
                "display": formatted_range   # ✅ THIS IS KEY
            }
        })

    return results