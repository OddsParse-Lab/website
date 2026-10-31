"""Export public aggregate chart data; never copy account or market identifiers.

python scripts/export-spotlag-chart-data.py /path/to/spotlag-blog/data
Uses only Python's standard library. Existing sample assertions intentionally fail
when inputs change so the article's scope and captions are reviewed together.
"""
import argparse
import gzip
import json
import re
import statistics
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("data", type=Path)
parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "content/posts/spotlag-charts.json")
args = parser.parse_args()
response = json.loads((args.data / "leadlag.json").read_text())
assert response["events"] == 4780 and response["placebo"] == 3502
local = (args.data / "leadlag.out").read_text().split("local clock", 1)[1].split("upstream clock", 1)[0]
rows = re.findall(r"repriced by\s+([+-]?[\d.]+)s: events (\d+)%\s+placebo (\d+)%\s+excess \+(\d+)%", local)
repricing = [dict(zip(["time", "event", "placebo", "excess"], map(float, row))) for row in rows]
assert len(repricing) == 10
report = (args.data / "spotlag_full.txt").read_text()
matches = re.findall(r"== (.*?): n=(\d+),.*?after fee ([+-][\d.]+)c \(95% CI ([+-]?[\d.]+)\.\.([+-]?[\d.]+)\)", report)
names = {"first cross in last 60s": "Final minute", "snapshot T-30": "T−30 s", "snapshot T-60": "T−60 s"}
ev = [{"label": names[name], "n": int(n), "mean": float(mean), "low": float(lo), "high": float(hi)} for name, n, mean, lo, hi in matches]
assert len(ev) == 3
section = (args.data / "population.out").read_text().split("== D. Edge toxicity", 1)[1].split("-- T60-5", 1)[0]
rows = re.findall(r"p-ask\[([^,]+),([^\)]+)\) n=\s*(\d+) model_pred=([\d.]+) ask=([\d.]+) actual_win=([\d.]+) pnl/contract=([+-][\d.]+)c", section)
labels = ["< 0", "0–2.5", "2.5–5", "5–10", "10–15", "15–20"]
disagreement = [{"label": label, "n": int(r[2]), "model": float(r[3])*100, "ask": float(r[4])*100, "actual": float(r[5])*100, "pnl": float(r[6])} for label, r in zip(labels, rows)]
assert len(disagreement) == 6
seen, zs = set(), []
with gzip.open(args.data / "samples.jsonl.gz", "rt") as fh:
    for line in fh:
        r = json.loads(line)
        if r["y"] is None or r["zreal"] is None or abs(r["tte"]-180) > 1.5 or r["k"] in seen:
            continue
        seen.add(r["k"])
        zs.append(r["zreal"])
assert len(zs) == 278 and round(statistics.pstdev(zs), 2) == 1.28
normal = statistics.NormalDist()
tails = [{"x": round(normal.inv_cdf((i+.5)/len(zs)), 6), "y": y} for i, y in enumerate(sorted(zs))]
output = {"response": response, "repricing": repricing, "ev": ev, "disagreement": disagreement, "tails": tails}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(output, indent=2) + "\n")
print(f"Exported five aggregate datasets to {args.output}")
