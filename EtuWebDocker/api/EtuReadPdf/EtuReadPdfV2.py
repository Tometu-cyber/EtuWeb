import io
import re
import json
import csv
import logging
from pathlib import Path
from PyPDF4 import PdfFileReader

SUBJECTS_REGEX = re.compile(r"Code .+ .+ :")
COMMENTS_REGEX = re.compile(r"Séance.+-")
GRADE_REGEX = re.compile(r"((\d+\.\d+ )?\(coeff (\d+\.\d+)\))|(Résultats non publiés)")

def remove0s(float_):
    return str(float_).rstrip("0").rstrip(".")


def extract_text(pdf_path):
    with open(pdf_path, "rb") as f:
        reader = PdfFileReader(f)
        text = []
        for page in range(reader.getNumPages()):
            page_text = reader.getPage(page).extractText().splitlines()
            page_text = [line.strip() for line in page_text[1:-3]]
            text.append("\n".join(page_text))
    return "\n".join(text)


def extract_subjects(text):
    out = []
    subjects = [m.start() for m in SUBJECTS_REGEX.finditer(text)]
    if not subjects:
        return out

    for i in range(len(subjects)):
        start = subjects[i]
        end = subjects[i + 1] if i + 1 < len(subjects) else None
        subject = text[start:end]
        subject = subject.splitlines()
        # name = " : ".join(subject[0].split(" : ")[1:])
        name = subject[0].replace("?","'")
        teacher = subject[1].split(" : ")[-1] if "Responsable" in subject[1] else "Pas de prof"
        average = None
        if "Moyenne" in subject[1]:
            average = remove0s(subject[1].split(" : ")[1].split(" ")[0])
        grades_text = subject[3:]

        raw_grades = []
        comments = []
        comment = []
        for line in grades_text:
            if COMMENTS_REGEX.match(line):
                if comment:
                    comments.append(" ".join(comment))
                    comment.clear()
                comment.append(line)
            elif grade_match := GRADE_REGEX.match(line):
                raw_grades.append(grade_match)
                if comment:
                    comments.append(" ".join(comment))
                    comment.clear()
            else:
                comment.append(line)
        if comment:
            comments.append(" ".join(comment))

        grades = []
        for match in filter(lambda g: g is not None, raw_grades):
            if match.groups()[-1] is None and match.group(2):
                grades.append((float(match.group(2)), float(match.group(3))))
            else:
                grades.append((match.group(),))

        if not average:
            filtered = list(filter(lambda g: len(g) > 1, grades))
            if filtered:
                divide_by = sum((g[1] for g in filtered)) or 1
                average = sum((g[0] * g[1] for g in filtered)) / divide_by
                average = f"{remove0s(round(average, 3))} (calculée)"
            else:
                average = "Pas de moyenne disponible"

        grades = ((remove0s(pair[0]), remove0s(pair[1])) if len(pair) == 2 else pair for pair in grades)
        grades = list(zip(comments, grades))

        out.append({
            "name": name,
            "teacher": teacher,
            "average": average,
            "grades": grades,
            "empty": "empty" if all((g[1][0] == "Résultats non publiés" for g in grades if g)) else ""
        })

    return out


def extract_header_data(text):
    lines = text.split("Nombre d'absences")[0].splitlines()
    adm = avg = pos = ""
    for line in lines:
        if line.startswith("Décision"):
            adm = line.split(":")[-1].strip()
        elif line.startswith("Moyenne"):
            avg = line.split(":")[-1].strip()
        elif line.startswith("Classement"):
            pos = line.split(":")[-1].strip()
    return adm, avg, pos


def export_to_json(data, output_path):
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    logging.info(f"Données exportées en JSON : {output_path}")


def export_to_csv(data, output_path):
    with open(output_path, "w", newline="", encoding="utf-8") as csvfile:
        fieldnames = ["subject", "teacher", "average", "comment", "note", "coefficient"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for subject in data:
            for comment, grade in subject["grades"]:
                if len(grade) == 2:
                    writer.writerow({
                        "subject": subject["name"],
                        "teacher": subject["teacher"],
                        "average": subject["average"],
                        "comment": comment,
                        "note": grade[0],
                        "coefficient": grade[1]
                    })
    logging.info(f"Données exportées en CSV : {output_path}")


def main():
    import argparse
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler("etureadpdf.log", mode='a', encoding='utf-8'),
            logging.StreamHandler()
        ]
    )

    parser = argparse.ArgumentParser(description="Extraction des données d'un relevé de notes PDF")
    parser.add_argument("fichier", help="Chemin du fichier PDF à traiter")
    parser.add_argument("--output", help="Fichier de sortie", default="output.json")
    parser.add_argument("--format", choices=["json", "csv"], default="json")
    args = parser.parse_args()

    pdf_path = Path(args.fichier)
    if not pdf_path.is_file():
        logging.error(f"Le fichier spécifié n'existe pas : {pdf_path}")
        return

    logging.info(f"Traitement du fichier PDF : {pdf_path}")
    text = extract_text(pdf_path)
    adm, avg, pos = extract_header_data(text)
    data = extract_subjects(text)

    output = {
        "admission": adm,
        "average": avg,
        "position": pos,
        "grades": data
    }

    if args.format == "json":
        export_to_json(output, args.output)
    else:
        export_to_csv(data, args.output)

    logging.info("Traitement terminé avec succès.")


if __name__ == "__main__":
    main()
