"""
Generador de casos dorados: implementación de referencia independiente del motor de deudas.

Implementación de referencia en Python, escrita a partir de docs/SPEC-engine.md,
SOLO para generar los casos dorados (packages/engine/test/fixtures/golden-cases.json).

NO es la implementación del motor. El motor en TypeScript debe salir de la spec,
no de traducir este archivo: si ambos coinciden siendo independientes, hay
confianza real en los números.

Uso:  python3 tools/golden-generator/generate.py > packages/engine/test/fixtures/golden-cases.json
"""
import json
import math

MAX_MONTHS = 600


def round_half_up(x: float) -> int:
    # Igual que Math.round de JS para valores positivos
    return math.floor(x + 0.5)


def monthly_rate(ea: float) -> float:
    return (1 + ea) ** (1 / 12) - 1


def priority(debts, strategy):
    if strategy == "avalanche":
        key = lambda d: (-d["annualEffectiveRate"], d["balance"], d["id"])
    elif strategy == "snowball":
        key = lambda d: (d["balance"], -d["annualEffectiveRate"], d["id"])
    else:  # minimum-only
        key = lambda d: d["id"]
    return [d["id"] for d in sorted(debts, key=key)]


def simulate(debts, monthly_budget, strategy, detail_months=2):
    min_sum = sum(d["minimumPayment"] for d in debts)
    if strategy != "minimum-only" and monthly_budget < min_sum:
        return {"status": "INVALID_BUDGET", "minimumRequired": min_sum}

    order = priority(debts, strategy)
    rates = {d["id"]: monthly_rate(d["annualEffectiveRate"]) for d in debts}
    # Alerta: la cuota mínima no alcanza a cubrir el interés del primer mes
    warnings = [
        {"code": "MINIMUM_BELOW_INTEREST", "debtId": d["id"]}
        for d in sorted(debts, key=lambda d: d["id"])
        if d["minimumPayment"] <= round_half_up(d["balance"] * rates[d["id"]])
    ]
    bal = {d["id"]: d["balance"] for d in debts}
    mins = {d["id"]: d["minimumPayment"] for d in debts}

    total_interest = 0
    total_paid = 0
    payoff = {}
    schedule = []
    month = 0

    while any(b > 0 for b in bal.values()):
        month += 1
        if month > MAX_MONTHS:
            return {"status": "NOT_PAYABLE", "monthsSimulated": MAX_MONTHS, "warnings": warnings}
        rows = {}
        # 1. Intereses
        for i in order:
            if bal[i] <= 0:
                continue
            opening = bal[i]
            interest = round_half_up(opening * rates[i])
            bal[i] += interest
            total_interest += interest
            rows[i] = {"debtId": i, "openingBalance": opening, "interest": interest, "payment": 0}

        # 2. Mínimos
        available = monthly_budget if strategy != "minimum-only" else None
        for i in order:
            if i not in rows:
                continue
            pay = min(mins[i], bal[i])
            bal[i] -= pay
            rows[i]["payment"] += pay
            total_paid += pay
            if available is not None:
                available -= pay

        # 3. Excedente en cascada según prioridad
        if available is not None:
            for i in order:
                if available <= 0:
                    break
                if i not in rows or bal[i] <= 0:
                    continue
                pay = min(available, bal[i])
                bal[i] -= pay
                rows[i]["payment"] += pay
                total_paid += pay
                available -= pay

        for i in order:
            if i in rows:
                rows[i]["closingBalance"] = bal[i]
                if bal[i] == 0 and i not in payoff:
                    payoff[i] = month
        if month <= detail_months:
            schedule.append({"month": month, "rows": [rows[i] for i in order if i in rows]})

    return {
        "status": "PAID_OFF",
        "warnings": warnings,
        "months": month,
        "totalInterest": total_interest,
        "totalPaid": total_paid,
        "payoffOrder": [{"debtId": i, "month": payoff[i]} for i in sorted(payoff, key=lambda k: (payoff[k], order.index(k)))],
        "firstMonths": schedule,
    }


CASES = [
    {
        "name": "un-credito-simple",
        "learning": "Un solo crédito: avalancha y bola de nieve son idénticas. Sirve para validar conversión de tasa e intereses.",
        "debts": [
            {"id": "libre-inversion", "name": "Libre inversión", "balance": 10_000_000, "annualEffectiveRate": 0.24, "minimumPayment": 500_000},
        ],
        "monthlyBudget": 500_000,
    },
    {
        "name": "tres-deudas-clasico",
        "learning": "El caso que muestra la diferencia: avalancha ahorra intereses, bola de nieve cierra una deuda antes.",
        "debts": [
            {"id": "tarjeta-a", "name": "Tarjeta A", "balance": 4_500_000, "annualEffectiveRate": 0.32, "minimumPayment": 225_000},
            {"id": "libre-inversion", "name": "Libre inversión", "balance": 12_000_000, "annualEffectiveRate": 0.21, "minimumPayment": 480_000},
            {"id": "tarjeta-b", "name": "Tarjeta B", "balance": 1_800_000, "annualEffectiveRate": 0.28, "minimumPayment": 90_000},
        ],
        "monthlyBudget": 1_300_000,
    },
    {
        "name": "mismo-orden",
        "learning": "Si la deuda más pequeña también es la más cara, ambas estrategias dan exactamente lo mismo.",
        "debts": [
            {"id": "tarjeta", "name": "Tarjeta", "balance": 2_000_000, "annualEffectiveRate": 0.33, "minimumPayment": 100_000},
            {"id": "vehiculo", "name": "Vehículo", "balance": 25_000_000, "annualEffectiveRate": 0.16, "minimumPayment": 750_000},
        ],
        "monthlyBudget": 1_200_000,
    },
    {
        "name": "trampa-de-minimos",
        "learning": "La cuota mínima no cubre los intereses: la deuda crece para siempre. El motor debe detectarlo.",
        "debts": [
            {"id": "tarjeta-grande", "name": "Tarjeta grande", "balance": 20_000_000, "annualEffectiveRate": 0.30, "minimumPayment": 300_000},
        ],
        "monthlyBudget": 300_000,
    },
    {
        "name": "presupuesto-insuficiente",
        "learning": "Validación: el presupuesto no alcanza ni para los mínimos.",
        "debts": [
            {"id": "tarjeta-a", "name": "Tarjeta A", "balance": 3_000_000, "annualEffectiveRate": 0.30, "minimumPayment": 150_000},
            {"id": "tarjeta-b", "name": "Tarjeta B", "balance": 2_000_000, "annualEffectiveRate": 0.28, "minimumPayment": 100_000},
        ],
        "monthlyBudget": 200_000,
    },
]


def main():
    out = {
        "generatedBy": "tools/golden-generator/generate.py",
        "spec": "docs/SPEC-engine.md",
        "rateConversions": [
            {"annualEffectiveRate": ea, "monthlyRate": monthly_rate(ea)}
            for ea in (0.12, 0.16, 0.21, 0.24, 0.28, 0.30, 0.32, 0.33)
        ],
        "cases": [],
    }
    for c in CASES:
        results = {}
        for s in ("avalanche", "snowball", "minimum-only"):
            results[s] = simulate(c["debts"], c["monthlyBudget"], s)
        out["cases"].append({**c, "expected": results})
    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
