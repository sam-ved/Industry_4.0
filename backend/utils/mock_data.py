import random
import time
from datetime import datetime, timedelta, timezone

def get_seeded_random():
    # Seeds the random generator to the current minute so values stay stable 
    # across multiple API requests in the same minute, avoiding flickering.
    return random.Random(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"))

def get_defect_mock():
    r = get_seeded_random()
    defect_types = ["scratch", "dent", "crack", "corrosion", "none"]
    detected = r.choices(defect_types, weights=[15, 10, 8, 5, 62])[0]
    confidence = round(r.uniform(0.72, 0.99), 3) if detected != "none" else 0.0
    bbox = [
        r.randint(50, 200),
        r.randint(50, 200),
        r.randint(250, 400),
        r.randint(250, 400),
    ] if detected != "none" else None
    severity = r.choice(["low", "medium", "high"]) if detected != "none" else None
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "defect_detected": detected != "none",
        "defect_type": detected if detected != "none" else None,
        "confidence": confidence,
        "bbox": bbox,
        "total_defects_today": r.randint(18, 30),
        "defect_rate_pct": round(r.uniform(2.1, 6.8), 2),
        "severity": severity,
        "image_width": 800,
        "image_height": 600,
        "all_detections": [{
            "defect_type": detected,
            "confidence": confidence,
            "bbox": bbox,
            "severity": severity
        }] if detected != "none" else [],
    }


def get_ppe_mock():
    r = get_seeded_random()
    zones = ["Zone A", "Zone B", "Zone C", "Zone D"]
    workers = []
    for i in range(r.randint(4, 8)):
        compliant = r.random() > 0.08
        workers.append({
            "worker_id": f"W{100 + i}",
            "zone": r.choice(zones),
            "helmet": compliant or r.random() > 0.3,
            "vest": compliant or r.random() > 0.4,
            "gloves": compliant or r.random() > 0.5,
            "boots": True,
            "compliant": compliant,
        })
    total = len(workers)
    compliant_count = sum(1 for w in workers if w["compliant"])
    equipment_detected = [
        {"name": "Helmet", "count": total - (total - compliant_count) // 2, "confidence": round(r.uniform(0.8, 0.99), 2)},
        {"name": "Vest", "count": total - (total - compliant_count) // 3, "confidence": round(r.uniform(0.75, 0.95), 2)},
        {"name": "Gloves", "count": total - (total - compliant_count) // 4, "confidence": round(r.uniform(0.7, 0.9), 2)}
    ]
    missing = []
    if r.random() > 0.5: missing.append("Helmet")
    if r.random() > 0.5: missing.append("Vest")
    
    compliance_status = "COMPLIANT" if not missing else "NON-COMPLIANT"
    risk_level = "LOW" if not missing else "HIGH"
    ppe_status_dict = {
        "Helmet": "NOT DETECTED" if "Helmet" in missing else "DETECTED",
        "Vest": "NOT DETECTED" if "Vest" in missing else "DETECTED",
        "Gloves": "DETECTED"
    }
    
    if compliance_status == "COMPLIANT":
        reasoning = "All required PPE items were detected."
    else:
        items_str = " and ".join(missing) if len(missing) <= 2 else ", ".join(missing[:-1]) + ", and " + missing[-1]
        verb = "were" if len(missing) > 1 else "was"
        reasoning = f"{items_str} {verb} not detected. Worker should wear missing PPE before entering the monitored area."
    
    return {
        "compliance_pct": round((compliant_count / total) * 100, 1),
        "compliance_status": compliance_status,
        "risk_level": risk_level,
        "ppe_status_dict": ppe_status_dict,
        "reasoning": reasoning,
        "detected_items": ["Helmet", "Vest", "Gloves"] if not missing else [req for req in ["Helmet", "Vest", "Gloves"] if req not in missing],
        "missing_items": missing,
        "review_items": [],
        "source": "mock",
        "frame_compliant": compliance_status == "COMPLIANT",
        "equipment_detected": equipment_detected,
        "missing_equipment": missing,
        "processing_time_ms": r.randint(100, 500),
        "llm_insights": "Workers are mostly compliant, but some are missing equipment." if missing else "All workers are compliant.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_workers": total,
        "compliant_count": compliant_count,
        "violation_count": total - compliant_count,
        "workers": workers,
    }


def get_energy_mock():
    r = get_seeded_random()
    now = datetime.now(timezone.utc)
    hourly = []
    base = 380
    for i in range(24):
        hour = (now - timedelta(hours=23 - i)).strftime("%H:00")
        peak_factor = 1.3 if 8 <= (now.hour - 23 + i) % 24 <= 17 else 0.85
        consumption = round(base * peak_factor + r.uniform(-30, 30), 1)
        co2 = round(consumption * 0.233, 2)
        hourly.append({"hour": hour, "kwh": consumption, "co2_kg": co2})

    total_kwh = sum(h["kwh"] for h in hourly)
    total_co2 = sum(h["co2_kg"] for h in hourly)
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_kwh_today": round(total_kwh, 1),
        "total_co2_kg": round(total_co2, 2),
        "current_kwh": hourly[-1]["kwh"],
        "peak_kwh": max(h["kwh"] for h in hourly),
        "avg_kwh": round(total_kwh / 24, 1),
        "change_pct": round(r.uniform(-5, 15), 1),
        "hourly": hourly,
        "by_machine": {
            "Line A": round(total_kwh * 0.35, 1),
            "Line B": round(total_kwh * 0.28, 1),
            "Compressor": round(total_kwh * 0.22, 1),
            "HVAC": round(total_kwh * 0.15, 1),
        },
    }


def get_maintenance_mock():
    r = get_seeded_random()
    machines = [
        {"id": "M001", "name": "CNC Mill Alpha", "type": "CNC"},
        {"id": "M002", "name": "Conveyor Belt B", "type": "Conveyor"},
        {"id": "M003", "name": "Hydraulic Press 3", "type": "Press"},
        {"id": "M004", "name": "Compressor Unit", "type": "Compressor"},
        {"id": "M005", "name": "Welding Robot R1", "type": "Robot"},
    ]
    results = []
    for m in machines:
        rul = r.randint(24, 720)
        health = min(100, max(10, int(rul / 7.2)))
        vibration = round(r.uniform(0.5, 4.5), 2)
        temp = round(r.uniform(45, 95), 1)
        results.append({
            "machine_id": m["id"],
            "machine_name": m["name"],
            "machine_type": m["type"],
            "rul_hours": rul,
            "health_score": health,
            "vibration_mm_s": vibration,
            "temperature_c": temp,
            "status": "critical" if rul < 72 else "warning" if rul < 168 else "healthy",
            "maintenance_due": (datetime.now(timezone.utc) + timedelta(hours=rul)).strftime("%Y-%m-%d %H:%M"),
            "anomaly_detected": vibration > 3.5 or temp > 85,
        })
    avg_rul = round(sum(res["rul_hours"] for res in results) / len(results), 1)
    avg_health = round(sum(res["health_score"] for res in results) / len(results), 1)
    critical_count = sum(1 for res in results if res["status"] == "critical")
    warning_count = sum(1 for res in results if res["status"] == "warning")
    healthy_count = sum(1 for res in results if res["status"] == "healthy")

    overall_health_status = "critical" if critical_count > 0 else "warning" if warning_count > 0 else "healthy"
    failure_risk = round(1.0 - (avg_health / 100.0), 2)
    days_until_failure = int(round(avg_rul / 24, 0))
    
    components_at_risk = []
    maintenance_schedule = []
    for res in results:
        risk_score = round(1.0 - (res["health_score"] / 100.0), 2)
        if risk_score > 0.3:
            components_at_risk.append({
                "name": res["machine_name"],
                "risk_score": risk_score,
                "recommended_action": "Inspect immediately" if risk_score > 0.7 else "Schedule maintenance"
            })
        maintenance_schedule.append({
            "component": res["machine_name"],
            "due_date": res["maintenance_due"].split(" ")[0],
            "priority": "critical" if res["status"] == "critical" else "high" if res["status"] == "warning" else "low"
        })

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "machines": results,
        "fleet_avg_rul": avg_rul,
        "fleet_avg_health": avg_health,
        "critical_count": critical_count,
        "warning_count": warning_count,
        "healthy_count": healthy_count,
        "health_status": overall_health_status,
        "failure_risk": failure_risk,
        "days_until_failure": days_until_failure,
        "components_at_risk": components_at_risk,
        "maintenance_schedule": maintenance_schedule,
    }


def get_dashboard_summary(defect, ppe, energy, maintenance):
    """Aggregated snapshot for the main dashboard KPIs."""
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "kpis": {
            "total_defects_today": defect["total_defects_today"],
            "defect_rate_pct": defect["defect_rate_pct"],
            "ppe_compliance_pct": ppe["compliance_pct"],
            "ppe_violations": ppe["violation_count"],
            "energy_kwh_today": energy["total_kwh_today"],
            "energy_change_pct": energy["change_pct"],
            "machine_health_score": maintenance["fleet_avg_health"],
            "fleet_avg_rul": maintenance["fleet_avg_rul"],
            "critical_machines": maintenance["critical_count"],
        },
        "system_status": "degraded" if maintenance["critical_count"] > 0 else "operational",
    }