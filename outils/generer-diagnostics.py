"""Régénère assets/js/diag-data.js à partir du catalogue Marc Employeur.

Usage : python outils/generer-diagnostics.py chemin/vers/Catalogue_9_poles.xlsx
Prérequis : pip install openpyxl

Lit l'onglet « Catalogue complet » (CODE, PÔLE, FAMILLE, SOUS-FAMILLE, ARTICLE…).
Une pièce = les familles de son pôle ; une question = une sous-famille,
illustrée par ses 3 premiers articles.
"""
import json
import pathlib
import re
import sys

import openpyxl

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "js" / "diag-data.js"

# Ordre du puzzle : clé, préfixe du pôle dans le catalogue, libellé, avatar
PIECES = [
    ("strategie", "1.", "Direction & Stratégie", "CAP"),
    ("rh", "2.", "Ressources Humaines", "BUDDY"),
    ("finance", "4.", "Finance & Gestion", "CENT"),
    ("commerce", "5.", "Commerce & Marketing", "DEAL"),
    ("digital", "6.", "Informatique & Digital", "BYTE"),
    ("achats", "7.", "Achat & Fournisseurs", "NEGO"),
    ("qvct", "8.", "QVCT & RSE", "VIBE"),
    ("sante", "3.", "Santé Sécurité", "SAFE"),
    ("board", "9.", "Board externalisé", "MARC"),
]


def strip_code(s):
    return re.sub(r"^\d+(\.\d+)*\s+", "", str(s)).strip()


def read_catalogue(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    rows = wb["Catalogue complet"].iter_rows(values_only=True)
    tree, started = {}, False
    for row in rows:
        if not started:
            started = row and row[0] == "CODE"
            continue
        code, pole, fam, sf, art = row[:5]
        if not pole or not art:
            continue
        tree.setdefault(pole, {}).setdefault(fam, {}).setdefault(sf, []).append(art)
    return tree


def build(tree):
    pieces = []
    for key, prefix, label, avatar in PIECES:
        pole = next(p for p in tree if str(p).startswith(prefix))
        families = []
        for fi, (fam, sfs) in enumerate(tree[pole].items(), 1):
            items = [
                {"id": f"{fi}.{si}", "label": strip_code(sf), "ex": [str(a).strip() for a in arts[:3]]}
                for si, (sf, arts) in enumerate(sfs.items(), 1)
            ]
            families.append({"id": str(fi), "label": strip_code(fam).replace(" — ", " · ").replace(" – ", " · "), "items": items})
        pieces.append({"key": key, "label": label, "avatar": avatar, "families": families})
    return {"version": 1, "pieces": pieces}


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    data = build(read_catalogue(sys.argv[1]))
    js = (
        "/* Les Employeurs · contenu des diagnostics (généré depuis le catalogue 9 pôles).\n"
        "   Une pièce = ses familles du catalogue ; chaque famille = ses sous-familles,\n"
        "   avec 3 exemples d’articles. Ne pas modifier à la main : relancer\n"
        "   outils/generer-diagnostics.py. */\n"
        "window.LE_DIAG_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    )
    OUT.write_text(js, encoding="utf-8", newline="\n")
    for p in data["pieces"]:
        print(f'{p["label"]:<26} {len(p["families"]):>2} familles  {sum(len(f["items"]) for f in p["families"]):>3} questions')


if __name__ == "__main__":
    main()
