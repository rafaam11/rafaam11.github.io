#!/usr/bin/env python3
"""Generate and verify the public portfolio project and CV PDFs.

Canonical command (PowerShell):
  node scripts/export-portfolio-data.cjs --output .superpowers/sdd/2026-08-16-3d-registration-partner-portfolio/pdf-input.json
  .superpowers/sdd/2026-08-16-3d-registration-partner-portfolio/.venv-pdf/Scripts/python.exe scripts/generate-portfolio-pdfs.py `
    --input .superpowers/sdd/2026-08-16-3d-registration-partner-portfolio/pdf-input.json `
    --output-dir output/pdf --publish-root . `
    --review-dir .superpowers/sdd/2026-08-16-3d-registration-partner-portfolio/pdf-review

Poppler is preferred by the PDF workflow. This generator uses PyMuPDF only when
the caller asks for review renders and Poppler is unavailable in the workspace.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import shutil
import sys
import uuid
from pathlib import Path
from typing import Any, Iterable


EXPECTED_SLUGS = [
    "surgical-navigation",
    "mandibular-fracture",
    "life-careverse",
    "rtms-navigation",
    "unmanned-forklift",
    "ai-build-lab",
]
LOCALES = ["ko", "en"]
CONTACT_EMAIL = "uiop3847@naver.com"
PUBLIC_SITE = {
    "name": "Jinmin Kim",
    "email": CONTACT_EMAIL,
    "portfolio": "https://rafaam11.github.io",
    "github": "https://github.com/rafaam11",
    "linkedin": "https://www.linkedin.com/in/rlawlsals",
}
ASCII_HYPHENS = str.maketrans({
    "֊": "-",
    "᠆": "-",
    "‐": "-",
    "‑": "-",
    "‒": "-",
    "–": "-",
    "—": "-",
    "−": "-",
    "⸗": "-",
    "⸺": "-",
    "⸻": "-",
    "﹘": "-",
    "﹣": "-",
    "－": "-",
})
PUBLIC_DASH_ENTITY_PATTERN = re.compile(r"&(?:dash|hyphen|ndash|mdash);?", re.I)
PUBLIC_PII_PATTERNS = [
    ("phone number", re.compile(r"(?:\+82[\s()./·-]*\(?0?10\)?|\(?010\)?)[\s()./·-]*\d{3,4}[\s()./·-]*\d{4}(?!\d)", re.I)),
    ("explicit English age", re.compile(r"\b\d{1,3}(?:\s+years?\s+old|[-\s]year[-\s]old)\b", re.I)),
    ("explicit Korean age", re.compile(r"(?:만\s*)?\d{1,3}\s*세(?![가-힣])", re.I)),
    ("Korean address", re.compile(r"(?:서울(?:특별시|시)?|부산(?:광역시|시)?|대구(?:광역시|시)?|인천(?:광역시|시)?|광주(?:광역시|시)?|대전(?:광역시|시)?|울산(?:광역시|시)?|세종(?:특별자치시|시)?)\s+[가-힣]{1,12}(?:구|군)(?![가-힣])", re.I)),
    ("Korean address", re.compile(r"[가-힣]{2,12}(?:특별자치도|도|광역시|특별시)\s+[가-힣]{1,12}(?:시|군|구)(?![가-힣])", re.I)),
    ("Korean address", re.compile(r"[가-힣]{2,12}(?:시|군|구)\s+[가-힣]{1,12}(?:구|읍|면|동|로|길)(?![가-힣])", re.I)),
    ("Korean address", re.compile(r"[가-힣]{2,20}(?:읍|면|동|로|길)\s*\d{1,5}(?:-\d{1,5})?(?!\d)", re.I)),
    ("romanized street address", re.compile(r"\b\d{1,5}(?:-\d{1,5})?\s+[A-Za-z][A-Za-z0-9.'-]*(?:\s+[A-Za-z][A-Za-z0-9.'-]*){0,3}(?:-ro|-gil|\s(?:Road|Rd\.?|Street|St\.?|Avenue|Ave\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Drive|Dr\.?))\s*,\s*[A-Za-z][A-Za-z.'-]*(?:-gu|-gun|-si)\s*,\s*(?:Seoul|Busan|Daegu|Incheon|Gwangju|Daejeon|Ulsan|Sejong|[A-Za-z][A-Za-z.'-]*-do)\b", re.I)),
]


def clean_text(value: Any) -> str:
    return str(value or "").translate(ASCII_HYPHENS).strip()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def require_object(value: Any, label: str) -> dict[str, Any]:
    require(isinstance(value, dict), f"{label} must be an object.")
    return value


def require_array(value: Any, label: str, length: int | None = None) -> list[Any]:
    require(isinstance(value, list), f"{label} must be an array.")
    if length is not None:
        require(len(value) == length, f"{label} must contain exactly {length} entries.")
    return value


def require_text(value: Any, label: str) -> str:
    require(isinstance(value, str) and bool(value.strip()), f"{label} must be a non-empty string.")
    return value


def validate_translation_record(record: dict[str, Any], label: str, fields: list[str]) -> None:
    translations = require_object(record.get("translations"), f"{label} translations")
    require(set(translations) == set(LOCALES), f"{label} translations must contain exactly ko and en.")
    for locale in LOCALES:
        copy = require_object(translations.get(locale), f"{label} {locale} translation")
        for field in fields:
            require_text(copy.get(field), f"{label} {locale} {field}")


def validate_localized_strings(value: Any, label: str) -> None:
    translations = require_object(value, f"{label} translations")
    require(set(translations) == set(LOCALES), f"{label} translations must contain exactly ko and en.")
    for locale in LOCALES:
        require_text(translations.get(locale), f"{label} {locale}")


def canonical_source_digest(payload: dict[str, Any]) -> str:
    source = {key: value for key, value in payload.items() if key != "sourceDigest"}
    encoded = json.dumps(source, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def normalize_public_separators(value: str) -> str:
    normalized = re.sub(r"[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]", " ", value)
    normalized = re.sub(r"[\u200b-\u200d\u2060\ufeff]", "", normalized)
    normalized = normalized.translate(str.maketrans({
        "‐": "-", "‑": "-", "‒": "-", "–": "-", "—": "-", "−": "-",
        "⁄": "/", "∕": "/", "／": "/",
        "•": "·", "‧": "·", "・": "·",
        "（": "(", "）": ")", "＋": "+",
    }))
    return re.sub(r"\s+", " ", normalized)


def public_text_scan_variants(value: str) -> list[str]:
    decoded = value
    for _ in range(6):
        next_value = PUBLIC_DASH_ENTITY_PATTERN.sub("-", html.unescape(decoded))
        if next_value == decoded:
            break
        decoded = next_value
    decoded = re.sub(r"&#(?:x)?[^;\s<]{1,24};?", " ", decoded, flags=re.I)
    decoded = re.sub(r"&[a-z][a-z0-9]{0,31};?", " ", decoded, flags=re.I)
    decoded = normalize_public_separators(decoded)
    def flatten_visible_text(separator: str) -> str:
        visible = re.sub(r"<!--[\s\S]*?-->", separator, decoded)
        visible = re.sub(r"<[^>]*>", separator, visible)
        visible = re.sub(r"<[^>]*$", separator, visible)
        return normalize_public_separators(visible)

    visible_with_spaces = flatten_visible_text(" ")
    visible_joined = flatten_visible_text("")
    return list(dict.fromkeys([decoded, visible_with_spaces, visible_joined]))


def public_pii_findings(value: Any) -> list[str]:
    strings: list[str] = []
    visited: set[int] = set()

    def collect(candidate: Any) -> None:
        if isinstance(candidate, str):
            strings.append(candidate)
            return
        if not isinstance(candidate, (dict, list, tuple)):
            return
        identity = id(candidate)
        if identity in visited:
            return
        visited.add(identity)
        if isinstance(candidate, dict):
            for key, nested in candidate.items():
                if isinstance(key, str):
                    strings.append(key)
                collect(nested)
        else:
            for nested in candidate:
                collect(nested)

    try:
        collect(value)
    except Exception:
        return []
    findings: list[str] = []
    for raw_text in strings:
        for text in public_text_scan_variants(raw_text):
            for label, pattern in PUBLIC_PII_PATTERNS:
                try:
                    match = pattern.search(text)
                except (TypeError, re.error):
                    match = None
                if match:
                    finding = f"{label}: {match.group(0)}"
                    if finding not in findings:
                        findings.append(finding)
    return findings


def validate_cv(cv_value: Any) -> dict[str, Any]:
    cv = require_object(cv_value, "PDF input public CV")
    require(cv.get("version") == "2026-08-16", "PDF input requires the approved public CV version.")
    identity = require_object(cv.get("identity"), "PDF input CV identity")
    require(identity.get("name") == "Jinmin Kim", "PDF input CV identity must be Jinmin Kim.")
    validate_translation_record(identity, "PDF input CV identity", ["displayName", "headline", "summary"])

    contacts = require_array(cv.get("contacts"), "PDF input CV contacts", 3)
    approved_contacts = {
        "Email": ("uiop3847@naver.com", "mailto:uiop3847@naver.com"),
        "GitHub": ("github.com/rafaam11", "https://github.com/rafaam11"),
        "LinkedIn": ("linkedin.com/in/rlawlsals", "https://www.linkedin.com/in/rlawlsals"),
    }
    seen_contacts: set[str] = set()
    for index, value in enumerate(contacts, start=1):
        contact = require_object(value, f"PDF input CV contact {index}")
        label = require_text(contact.get("label"), f"PDF input CV contact {index} label")
        value_text = require_text(contact.get("value"), f"PDF input CV contact {index} value")
        href = require_text(contact.get("href"), f"PDF input CV contact {index} href")
        require(label in approved_contacts and label not in seen_contacts and approved_contacts[label] == (value_text, href),
                f"PDF input CV contact {index} is not an approved public contact.")
        seen_contacts.add(label)
    require(seen_contacts == set(approved_contacts), "PDF input CV contacts must contain Email, GitHub, and LinkedIn.")

    timeline = require_array(cv.get("timeline"), "PDF input CV timeline", 4)
    for index, value in enumerate(timeline, start=1):
        entry = require_object(value, f"PDF input CV timeline entry {index}")
        require_text(entry.get("period"), f"PDF input CV timeline entry {index} period")
        require_text(entry.get("organization"), f"PDF input CV timeline entry {index} organization")
        validate_translation_record(entry, f"PDF input CV timeline entry {index}", ["role", "summary"])

    capabilities = require_array(cv.get("capabilities"), "PDF input CV capabilities", 4)
    for index, value in enumerate(capabilities, start=1):
        validate_translation_record(require_object(value, f"PDF input CV capability {index}"),
                                    f"PDF input CV capability {index}", ["title", "body"])

    research_entries = require_array(cv.get("research"), "PDF input CV research", 2)
    for index, value in enumerate(research_entries, start=1):
        research = require_object(value, f"PDF input CV research entry {index}")
        for field in ["year", "title", "venue", "role"]:
            require_text(research.get(field), f"PDF input CV research entry {index} {field}")
        if "href" in research:
            href = require_text(research.get("href"), f"PDF input CV research entry {index} href")
            require(href.startswith("https://"), f"PDF input CV research entry {index} href must use HTTPS.")

    achievements = require_object(cv.get("achievements"), "PDF input CV achievements")
    require(achievements.get("patentApplications") == 7 and achievements.get("patentGrants") == 3 and
            achievements.get("awardTotal") == 9,
            "PDF input CV achievement totals must remain 7 applications, 3 grants, and 9 awards.")
    require_text(achievements.get("asOf"), "PDF input CV achievements asOf")
    awards = require_array(achievements.get("selectedAwards"), "PDF input CV selected awards", 3)
    for index, value in enumerate(awards, start=1):
        award = require_object(value, f"PDF input CV selected award {index}")
        require_text(award.get("year"), f"PDF input CV selected award {index} year")
        validate_localized_strings(award.get("translations"), f"PDF input CV selected award {index}")

    languages = require_array(cv.get("languages"), "PDF input CV languages", 2)
    for index, value in enumerate(languages, start=1):
        language = require_object(value, f"PDF input CV language {index}")
        require_text(language.get("language"), f"PDF input CV language {index} language")
        validate_localized_strings(language.get("translations"), f"PDF input CV language {index}")
    findings = public_pii_findings(cv)
    require(not findings, f"PDF input CV contains private age, phone, or address PII ({'; '.join(findings)}).")
    return cv


def validate_export_schema(payload: dict[str, Any]) -> None:
    require(set(payload) == {"schemaVersion", "locales", "site", "capabilities", "tiers", "projects",
                             "evidence", "cv", "sourceDigest"},
            "PDF input must contain exactly the canonical source schema fields.")
    require(payload.get("schemaVersion") == 1, "Unsupported PDF input schemaVersion.")
    require(payload.get("locales") == LOCALES, "PDF input must declare ko and en locales in order.")
    site = require_object(payload.get("site"), "PDF input site")
    for field in ["name", "email", "portfolio", "github", "linkedin"]:
        require_text(site.get(field), f"PDF input site {field}")
    require(site == PUBLIC_SITE, "PDF input requires the exact public site and contact boundary.")

    capabilities = require_array(payload.get("capabilities"), "PDF input capabilities", 5)
    capability_keys: set[str] = set()
    for index, value in enumerate(capabilities, start=1):
        capability = require_object(value, f"PDF input capability {index}")
        key = require_text(capability.get("key"), f"PDF input capability {index} key")
        require(key not in capability_keys, f"PDF input capability key is duplicated: {key}.")
        capability_keys.add(key)
        validate_translation_record(capability, f"PDF input capability {index}", ["title"])

    tiers = require_array(payload.get("tiers"), "PDF input tiers", 3)
    tier_keys: set[str] = set()
    for index, value in enumerate(tiers, start=1):
        tier = require_object(value, f"PDF input tier {index}")
        key = require_text(tier.get("key"), f"PDF input tier {index} key")
        tier_keys.add(key)
        validate_translation_record(tier, f"PDF input tier {index}", ["label"])

    projects = require_array(payload.get("projects"), "PDF input projects", len(EXPECTED_SLUGS))
    project_slugs: list[str] = []
    project_copy_fields = [
        "title", "shortTitle", "eyebrow", "thesis", "summary", "problem", "role",
        "teamResult", "evidence", "limitation", "collaboration", "mediaCaption", "status", "ownedRole"
    ]
    for index, value in enumerate(projects, start=1):
        project = require_object(value, f"PDF input project {index}")
        slug = require_text(project.get("slug"), f"PDF input project {index} slug")
        project_slugs.append(slug)
        require_text(project.get("period"), f"PDF input project {slug} period")
        tier = require_text(project.get("tier"), f"PDF input project {slug} tier")
        require(tier in tier_keys, f"PDF input project {slug} has an unknown tier.")
        keys = require_array(project.get("capabilityKeys"), f"PDF input project {slug} capabilityKeys")
        require(bool(keys), f"PDF input project {slug} capabilityKeys must not be empty.")
        for key in keys:
            require(isinstance(key, str) and key in capability_keys,
                    f"PDF input project {slug} contains an unknown capability key.")
        tech = require_array(project.get("tech"), f"PDF input project {slug} tech")
        for item in tech:
            require_text(item, f"PDF input project {slug} tech item")
        validate_translation_record(project, f"PDF input project {slug}", project_copy_fields)

        blocks = require_array(project.get("blocks"), f"PDF input project {slug} blocks")
        for block_index, block_value in enumerate(blocks, start=1):
            block = require_object(block_value, f"PDF input project {slug} block {block_index}")
            block_type = require_text(block.get("type"), f"PDF input project {slug} block {block_index} type")
            translations = require_object(block.get("translations"), f"PDF input project {slug} block {block_index} translations")
            for locale in LOCALES:
                copy = require_object(translations.get(locale), f"PDF input project {slug} block {block_index} {locale}")
                require_text(copy.get("heading"), f"PDF input project {slug} block {block_index} {locale} heading")
                if block_type == "list":
                    items = require_array(copy.get("items"), f"PDF input project {slug} block {block_index} {locale} items")
                    require(bool(items), f"PDF input project {slug} block {block_index} {locale} items must not be empty.")
                    for item in items:
                        require_text(item, f"PDF input project {slug} block {block_index} {locale} item")
                else:
                    require_text(copy.get("body"), f"PDF input project {slug} block {block_index} {locale} body")

        links = require_array(project.get("links"), f"PDF input project {slug} links")
        for link_index, link_value in enumerate(links, start=1):
            link = require_object(link_value, f"PDF input project {slug} link {link_index}")
            href = require_text(link.get("href"), f"PDF input project {slug} link {link_index} href")
            require(href.startswith("https://"), f"PDF input project {slug} link {link_index} must use HTTPS.")
            validate_translation_record(link, f"PDF input project {slug} link {link_index}", ["label"])
    require(project_slugs == EXPECTED_SLUGS, "PDF input must contain the six canonical projects in order.")

    evidence_entries = require_array(payload.get("evidence"), "PDF input evidence")
    for index, value in enumerate(evidence_entries, start=1):
        entry = require_object(value, f"PDF input evidence entry {index}")
        for field in ["id", "project", "type", "state", "source", "note"]:
            require_text(entry.get(field), f"PDF input evidence entry {index} {field}")
        require(entry["project"] in EXPECTED_SLUGS, f"PDF input evidence entry {index} has an unknown project.")
        if entry["state"] == "approved-public":
            require(entry["source"].startswith("https://"),
                    f"PDF input evidence entry {index} approved source must use HTTPS.")

    validate_cv(payload.get("cv"))
    digest = require_text(payload.get("sourceDigest"), "PDF input sourceDigest")
    require(bool(re.fullmatch(r"[a-f0-9]{64}", digest)), "PDF input sourceDigest must be lowercase SHA-256.")
    require(digest == canonical_source_digest(payload), "PDF input source digest does not match its canonical content.")


def load_export(file_path: Path) -> dict[str, Any]:
    require(file_path.is_file(), f"Missing PDF input: {file_path}")
    try:
        payload = json.loads(file_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise ValueError(f"Malformed PDF input: {error}") from error
    require(isinstance(payload, dict), "PDF input must be a JSON object.")
    validate_export_schema(payload)
    serialized = json.dumps(payload, ensure_ascii=False)
    for pattern in [r"(?:^|[\s\"'(])(?:[A-Za-z]:[\\/]|\\\\)", r"file://", r"OneDrive", r"private[\\/]raw"]:
        require(not re.search(pattern, serialized, re.IGNORECASE), "PDF input exposes a private source path.")
    return payload


def sha256(file_path: Path) -> str:
    digest = hashlib.sha256()
    with file_path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_arguments(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate deterministic public portfolio PDFs.")
    parser.add_argument("--input", required=True, type=Path, help="Deterministic JSON exported by export-portfolio-data.cjs")
    parser.add_argument("--output-dir", type=Path, default=Path("output/pdf"), help="PDF-skill deliverable directory")
    parser.add_argument("--publish-root", type=Path, default=Path("."), help="Repository root containing assets/")
    parser.add_argument("--review-dir", type=Path, help="Ignored directory for all-page PNGs and contact sheets")
    parser.add_argument("--font-regular", type=Path, default=Path(r"C:\Windows\Fonts\malgun.ttf"))
    parser.add_argument("--font-bold", type=Path, default=Path(r"C:\Windows\Fonts\malgunbd.ttf"))
    parser.add_argument("--validate-only", action="store_true", help="Validate JSON without importing PDF dependencies")
    return parser.parse_args(argv)


def import_pdf_dependencies() -> dict[str, Any]:
    try:
        import fitz
        from PIL import Image, ImageDraw
        from pypdf import PdfReader
        from reportlab.lib.colors import HexColor
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.pdfgen import canvas
    except ImportError as error:
        raise RuntimeError(
            "Missing PDF dependency. Install requirements-pdf.txt in the ignored Task 5 virtual environment."
        ) from error
    return {
        "fitz": fitz,
        "Image": Image,
        "ImageDraw": ImageDraw,
        "PdfReader": PdfReader,
        "HexColor": HexColor,
        "A4": A4,
        "pdfmetrics": pdfmetrics,
        "TTFont": TTFont,
        "canvas": canvas,
    }


class TechnicalDocument:
    def __init__(self, dependencies: dict[str, Any], output: Path, title: str, subject: str,
                 locale: str, total_pages: int) -> None:
        self.d = dependencies
        self.width, self.height = dependencies["A4"]
        self.left = 48
        self.right = self.width - 48
        self.top = self.height - 48
        self.bottom = 42
        self.locale = locale
        self.total_pages = total_pages
        self.title = clean_text(title)
        self.canvas = dependencies["canvas"].Canvas(
            str(output), pagesize=dependencies["A4"], pageCompression=0, invariant=1
        )
        self.canvas.setTitle(self.title)
        self.canvas.setAuthor("Jinmin Kim")
        self.canvas.setSubject(clean_text(subject))
        self.canvas.setCreator("Jinmin Kim Portfolio PDF Generator")
        self.canvas.setKeywords("3D registration, robot software, public portfolio")
        self.canvas._doc.info.producer = "Jinmin Kim Portfolio PDF Generator"
        self.colors = {
            "paper": dependencies["HexColor"]("#FBFCFB"),
            "ink": dependencies["HexColor"]("#101715"),
            "muted": dependencies["HexColor"]("#586560"),
            "line": dependencies["HexColor"]("#B9C4C0"),
            "signal": dependencies["HexColor"]("#0C6B5E"),
            "warm": dependencies["HexColor"]("#A94B32"),
            "soft": dependencies["HexColor"]("#EEF1EF"),
        }

    def begin_page(self, number: int, section: str) -> None:
        c = self.canvas
        c.setFillColor(self.colors["paper"])
        c.rect(0, 0, self.width, self.height, fill=1, stroke=0)
        c.setStrokeColor(self.colors["line"])
        c.setLineWidth(0.7)
        c.line(self.left, self.top + 8, self.right, self.top + 8)
        c.setFillColor(self.colors["muted"])
        c.setFont("MalgunGothic", 7.5)
        c.drawString(self.left, self.top + 17, clean_text(section).upper())
        c.drawRightString(self.right, self.top + 17, "JINMIN KIM / PUBLIC TECHNICAL DOCUMENT")
        c.line(self.left, self.bottom - 10, self.right, self.bottom - 10)
        c.setFont("MalgunGothic", 7.5)
        c.drawString(self.left, self.bottom - 25, self.title)
        page_label = f"{number} / {self.total_pages}"
        c.drawRightString(self.right, self.bottom - 25, page_label)
        email_width = self.d["pdfmetrics"].stringWidth(CONTACT_EMAIL, "MalgunGothic", 7.5)
        email_x = self.right - email_width - 58
        c.setFillColor(self.colors["signal"])
        c.drawString(email_x, self.bottom - 25, CONTACT_EMAIL)
        c.linkURL(f"mailto:{CONTACT_EMAIL}", (email_x, self.bottom - 28, email_x + email_width, self.bottom - 17), relative=0)

    def finish_page(self) -> None:
        self.canvas.showPage()

    def save(self) -> None:
        self.canvas.save()

    def wrap(self, text: Any, font: str, size: float, width: float) -> list[str]:
        value = clean_text(text)
        if not value:
            return []
        tokens = re.findall(r"\S+\s*", value)
        lines: list[str] = []
        current = ""
        measure = self.d["pdfmetrics"].stringWidth
        for token in tokens:
            candidate = current + token
            if current and measure(candidate.rstrip(), font, size) > width:
                lines.append(current.rstrip())
                current = token.lstrip()
            else:
                current = candidate
            while measure(current.rstrip(), font, size) > width and len(current) > 1:
                split = len(current) - 1
                while split > 1 and measure(current[:split].rstrip(), font, size) > width:
                    split -= 1
                lines.append(current[:split].rstrip())
                current = current[split:].lstrip()
        if current.strip():
            lines.append(current.rstrip())
        return lines

    def text(self, text: Any, x: float, y: float, width: float, size: float = 10,
             font: str = "MalgunGothic", leading: float | None = None,
             color: str = "ink", max_lines: int | None = None) -> float:
        lines = self.wrap(text, font, size, width)
        if max_lines is not None:
            lines = lines[:max_lines]
        leading = leading or size * 1.5
        self.canvas.setFillColor(self.colors[color])
        self.canvas.setFont(font, size)
        for line in lines:
            self.canvas.drawString(x, y, line)
            y -= leading
        return y

    def heading(self, text: Any, y: float, size: float = 22) -> float:
        self.canvas.setFillColor(self.colors["ink"])
        self.canvas.setFont("MalgunGothic-Bold", size)
        lines = self.wrap(text, "MalgunGothic-Bold", size, self.right - self.left)
        for line in lines:
            self.canvas.drawString(self.left, y, line)
            y -= size * 1.25
        self.canvas.setStrokeColor(self.colors["ink"])
        self.canvas.line(self.left, y - 3, self.right, y - 3)
        return y - 24

    def label(self, text: Any, x: float, y: float, color: str = "signal") -> None:
        self.canvas.setFillColor(self.colors[color])
        self.canvas.setFont("MalgunGothic-Bold", 7.5)
        self.canvas.drawString(x, y, clean_text(text).upper())

    def section(self, label: Any, title: Any, body: Any, y: float, height: float,
                accent: str = "signal") -> float:
        self.canvas.setFillColor(self.colors["soft"])
        self.canvas.rect(self.left, y - height, self.right - self.left, height, fill=1, stroke=0)
        self.canvas.setFillColor(self.colors[accent])
        self.canvas.rect(self.left, y - height, 4, height, fill=1, stroke=0)
        self.label(label, self.left + 16, y - 22, accent)
        title_y = self.text(title, self.left + 16, y - 44, self.right - self.left - 32,
                            size=13, font="MalgunGothic-Bold", leading=18, max_lines=2)
        self.text(body, self.left + 16, title_y - 4, self.right - self.left - 32,
                  size=9.5, leading=15, color="muted", max_lines=max(1, int((height - 68) / 15)))
        return y - height - 12

    def link(self, label: Any, url: str, x: float, y: float, size: float = 9) -> float:
        text = clean_text(label)
        self.canvas.setFont("MalgunGothic", size)
        self.canvas.setFillColor(self.colors["signal"])
        self.canvas.drawString(x, y, text)
        width = self.d["pdfmetrics"].stringWidth(text, "MalgunGothic", size)
        self.canvas.line(x, y - 2, x + width, y - 2)
        self.canvas.linkURL(url, (x, y - 4, x + width, y + size + 2), relative=0)
        return width

    def flow(self, labels: Iterable[str], y: float) -> float:
        items = list(labels)[:4]
        while len(items) < 4:
            items.append("")
        gap = 10
        width = (self.right - self.left - gap * 3) / 4
        height = 92
        for index, item in enumerate(items):
            x = self.left + index * (width + gap)
            self.canvas.setFillColor(self.colors["soft"])
            self.canvas.setStrokeColor(self.colors["line"])
            self.canvas.roundRect(x, y - height, width, height, 4, fill=1, stroke=1)
            self.label(f"0{index + 1}", x + 10, y - 18)
            self.text(item, x + 10, y - 40, width - 20, size=8.2, font="MalgunGothic-Bold",
                      leading=12, max_lines=4)
            if index < 3:
                self.canvas.setStrokeColor(self.colors["signal"])
                self.canvas.line(x + width + 2, y - height / 2, x + width + gap - 2, y - height / 2)
        return y - height


def register_fonts(dependencies: dict[str, Any], regular: Path, bold: Path) -> None:
    require(regular.is_file(), f"Missing Korean font: {regular}")
    require(bold.is_file(), f"Missing Korean bold font: {bold}")
    dependencies["pdfmetrics"].registerFont(dependencies["TTFont"]("MalgunGothic", str(regular)))
    dependencies["pdfmetrics"].registerFont(dependencies["TTFont"]("MalgunGothic-Bold", str(bold)))


def localized(record: dict[str, Any], locale: str) -> dict[str, Any]:
    translations = record.get("translations")
    require(isinstance(translations, dict) and isinstance(translations.get(locale), dict),
            f"Missing {locale} translation.")
    return translations[locale]


def capability_label(payload: dict[str, Any], key: str, locale: str) -> str:
    for capability in payload["capabilities"]:
        if capability.get("key") == key:
            return clean_text(localized(capability, locale).get("title"))
    return clean_text(key)


def tier_label(payload: dict[str, Any], key: str, locale: str) -> str:
    for tier in payload["tiers"]:
        if tier.get("key") == key:
            return clean_text(localized(tier, locale).get("label"))
    return clean_text(key)


def project_labels(locale: str) -> dict[str, str]:
    if locale == "ko":
        return {
            "case": "기술 사례",
            "state": "근거 상태",
            "period": "기간",
            "tier": "포트폴리오 구분",
            "capability": "핵심 역량",
            "problem": "문제와 시스템 경계",
            "problem_label": "문제",
            "boundary": "공개 경계",
            "decision": "소유한 결정과 구현",
            "role": "개인 역할",
            "flow": "시스템 관계",
            "flow_note": "설명용 시스템 관계 다이어그램이며 사진 또는 실험 근거가 아닙니다.",
            "tech": "구현 기술",
            "evidence": "검증 및 근거 원장",
            "registered": "등록된 공개 근거",
            "pending": "공개 승인 대기",
            "approved": "공개 확인 가능",
            "attribution": "역할, 팀 결과, 한계",
            "team": "팀 결과",
            "limit": "한계",
            "collaboration": "협업 경계",
            "recap": "요약 및 공동개발 제안",
            "contact": "함께 정의할 내용",
            "contact_body": "문제, 데이터 또는 센서, 목표 검증, 일정을 알려주시면 좌표계와 근거 경계부터 함께 정의합니다.",
            "open": "공개 링크 열기",
            "no_public": "현재 등록된 외부 공개 링크가 없습니다.",
        }
    return {
        "case": "Technical case",
        "state": "Evidence state",
        "period": "Period",
        "tier": "Portfolio tier",
        "capability": "Primary capability",
        "problem": "Problem and system boundary",
        "problem_label": "Problem",
        "boundary": "Public boundary",
        "decision": "Owned decisions and implementation",
        "role": "My role",
        "flow": "System relationship",
        "flow_note": "Explanatory system relationship diagram; it is not photographic or experimental evidence.",
        "tech": "Implementation technologies",
        "evidence": "Verification and evidence ledger",
        "registered": "Registered public evidence",
        "pending": "Pending public approval",
        "approved": "Publicly inspectable",
        "attribution": "Role, team result, and limits",
        "team": "Team result",
        "limit": "Limitations",
        "collaboration": "Collaboration boundary",
        "recap": "Recap and joint-development invitation",
        "contact": "What to bring",
        "contact_body": "Share the problem, data or sensors, target validation, and schedule. We can define coordinate and evidence boundaries together.",
        "open": "Open public link",
        "no_public": "No external public link is currently registered.",
    }


def generate_project_pdf(dependencies: dict[str, Any], payload: dict[str, Any], project: dict[str, Any],
                         locale: str, output: Path) -> None:
    copy = localized(project, locale)
    labels = project_labels(locale)
    doc = TechnicalDocument(dependencies, output, copy["title"], copy["thesis"], locale, 6)
    content_width = doc.right - doc.left

    # 1. Cover
    doc.begin_page(1, labels["case"])
    y = doc.top - 42
    doc.label(copy["eyebrow"], doc.left, y)
    y = doc.text(copy["title"], doc.left, y - 38, content_width, size=27,
                 font="MalgunGothic-Bold", leading=34, max_lines=3)
    doc.canvas.setFillColor(doc.colors["signal"])
    doc.canvas.rect(doc.left, y - 15, 76, 4, fill=1, stroke=0)
    y = doc.text(copy["thesis"], doc.left, y - 48, content_width * 0.86, size=15,
                 font="MalgunGothic-Bold", leading=23, max_lines=4)
    facts = [
        (labels["state"], copy["status"]),
        (labels["period"], project["period"]),
        (labels["tier"], tier_label(payload, project["tier"], locale)),
        (labels["capability"], capability_label(payload, project["capabilityKeys"][0], locale)),
    ]
    fact_y = max(y - 36, 330)
    column_width = (content_width - 12) / 2
    for index, (label, value) in enumerate(facts):
        x = doc.left + (index % 2) * (column_width + 12)
        row_y = fact_y - (index // 2) * 78
        doc.canvas.setStrokeColor(doc.colors["line"])
        doc.canvas.rect(x, row_y - 58, column_width, 58, fill=0, stroke=1)
        doc.label(label, x + 12, row_y - 18)
        doc.text(value, x + 12, row_y - 38, column_width - 24, size=9,
                 font="MalgunGothic-Bold", leading=13, max_lines=2)
    doc.text(copy["summary"], doc.left, fact_y - 190, content_width, size=9.5,
             leading=15, color="muted", max_lines=5)
    doc.finish_page()

    # 2. Problem and boundary
    doc.begin_page(2, labels["problem"])
    y = doc.heading(labels["problem"], doc.top - 32)
    y = doc.section(labels["problem_label"], copy["problem"], copy["summary"], y, 178)
    y = doc.section(labels["boundary"], copy["limitation"], copy["collaboration"], y, 178, "warm")
    doc.label(labels["state"], doc.left, y - 8)
    doc.text(f"{copy['status']} / {copy['mediaCaption']}", doc.left, y - 30, content_width,
             size=9.5, leading=15, color="muted", max_lines=5)
    doc.finish_page()

    # 3. Owned implementation and factual relationship diagram
    doc.begin_page(3, labels["decision"])
    y = doc.heading(labels["decision"], doc.top - 32)
    doc.label(labels["role"], doc.left, y)
    y = doc.text(copy["role"], doc.left, y - 25, content_width, size=10.5,
                 leading=17, max_lines=7) - 12
    flow_blocks = []
    for block in project.get("blocks", []):
        block_copy = localized(block, locale)
        if block.get("type") == "list":
            flow_blocks.extend(block_copy.get("items", []))
        elif block.get("type") in {"system", "text", "evidence"}:
            flow_blocks.append(block_copy.get("heading", ""))
    if len(flow_blocks) < 4:
        flow_blocks.extend(project.get("tech", []))
    doc.label(labels["flow"], doc.left, y)
    y = doc.flow([clean_text(item) for item in flow_blocks[:4]], y - 18)
    y = doc.text(labels["flow_note"], doc.left, y - 15, content_width, size=8,
                 leading=12, color="muted", max_lines=2) - 16
    doc.label(labels["tech"], doc.left, y)
    doc.text(" / ".join(clean_text(item) for item in project.get("tech", [])), doc.left, y - 24,
             content_width, size=9, leading=14, color="muted", max_lines=5)
    doc.finish_page()

    # 4. Evidence ledger
    doc.begin_page(4, labels["evidence"])
    y = doc.heading(labels["evidence"], doc.top - 32)
    doc.label(labels["registered"], doc.left, y)
    y -= 22
    evidence = [entry for entry in payload["evidence"] if entry.get("project") == project["slug"]]
    for entry in evidence:
        approved = entry.get("state") == "approved-public"
        state_label = labels["approved"] if approved else labels["pending"]
        row_height = 78
        doc.canvas.setFillColor(doc.colors["soft"] if approved else doc.colors["paper"])
        doc.canvas.setStrokeColor(doc.colors["line"])
        doc.canvas.rect(doc.left, y - row_height, content_width, row_height, fill=1, stroke=1)
        doc.label(f"{entry.get('type', '')} / {state_label}", doc.left + 12, y - 18,
                  "signal" if approved else "warm")
        doc.text(entry.get("id", ""), doc.left + 12, y - 39, content_width - 24,
                 size=10, font="MalgunGothic-Bold", leading=14, max_lines=1)
        note_y = doc.text(entry.get("note", ""), doc.left + 12, y - 57, content_width - 24,
                          size=7.7, leading=11, color="muted", max_lines=2)
        source = clean_text(entry.get("source"))
        if approved and source.startswith("https://"):
            doc.link(labels["open"], source, doc.right - 112, y - 39, 8)
        y -= row_height + 9
    y -= 6
    doc.label(labels["evidence"], doc.left, y)
    doc.text(copy["evidence"], doc.left, y - 24, content_width, size=9.5,
             leading=15, color="muted", max_lines=6)
    doc.finish_page()

    # 5. Attribution
    doc.begin_page(5, labels["attribution"])
    y = doc.heading(labels["attribution"], doc.top - 32)
    y = doc.section(labels["role"], copy["ownedRole"], copy["role"], y, 140)
    y = doc.section(labels["team"], copy["teamResult"], copy["evidence"], y, 140)
    column_gap = 12
    column_width = (content_width - column_gap) / 2
    for index, (label, title, body, accent) in enumerate([
        (labels["limit"], copy["limitation"], copy["mediaCaption"], "warm"),
        (labels["collaboration"], copy["collaboration"], copy["summary"], "signal"),
    ]):
        x = doc.left + index * (column_width + column_gap)
        doc.canvas.setStrokeColor(doc.colors["line"])
        doc.canvas.rect(x, y - 172, column_width, 172, fill=0, stroke=1)
        doc.label(label, x + 12, y - 20, accent)
        title_y = doc.text(title, x + 12, y - 44, column_width - 24, size=9,
                           font="MalgunGothic-Bold", leading=14, max_lines=5)
        doc.text(body, x + 12, title_y - 8, column_width - 24, size=7.8,
                 leading=12, color="muted", max_lines=5)
    doc.finish_page()

    # 6. Recap and invitation
    doc.begin_page(6, labels["recap"])
    y = doc.heading(labels["recap"], doc.top - 32)
    y = doc.text(copy["thesis"], doc.left, y, content_width, size=15,
                 font="MalgunGothic-Bold", leading=22, max_lines=4) - 20
    capability_titles = [capability_label(payload, key, locale) for key in project.get("capabilityKeys", [])]
    doc.label(labels["capability"], doc.left, y)
    y = doc.text(" / ".join(capability_titles), doc.left, y - 23, content_width, size=9.5,
                 leading=15, color="muted", max_lines=3) - 18
    public_links: list[tuple[str, str]] = []
    for link in project.get("links", []):
        link_copy = localized(link, locale)
        public_links.append((clean_text(link_copy.get("label")), clean_text(link.get("href"))))
    seen_urls = {url for _, url in public_links}
    for entry in payload["evidence"]:
        source = clean_text(entry.get("source"))
        if entry.get("project") == project["slug"] and entry.get("state") == "approved-public" and source.startswith("https://") and source not in seen_urls:
            public_links.append((clean_text(entry.get("id")), source))
            seen_urls.add(source)
    doc.label(labels["registered"], doc.left, y)
    y -= 24
    if public_links:
        for label, url in public_links:
            doc.link(label, url, doc.left, y, 9)
            y -= 24
    else:
        y = doc.text(labels["no_public"], doc.left, y, content_width, size=9,
                     leading=14, color="muted", max_lines=2) - 10
    y = min(y - 20, 410)
    y = doc.section(labels["contact"], labels["contact_body"], copy["collaboration"], y, 154)
    doc.link(CONTACT_EMAIL, f"mailto:{CONTACT_EMAIL}", doc.left, y - 4, 10)
    doc.link("rafaam11.github.io", "https://rafaam11.github.io", doc.left + 190, y - 4, 10)
    doc.finish_page()
    doc.save()


def cv_labels(locale: str) -> dict[str, str]:
    if locale == "ko":
        return {
            "document": "공개 이력서",
            "profile": "프로필",
            "timeline": "경력 및 학력",
            "capabilities": "사용 및 구현 경험",
            "research": "연구 및 공개 근거",
            "signals": "성과 신호",
            "patents": "특허",
            "awards": "수상",
            "selected": "선정 수상",
            "languages": "언어",
            "projects": "대표 작업 범위",
            "source": "2026-08-16 승인된 공개 사실만 사용한 2페이지 CV입니다.",
            "patent_value": "출원 {applications}건 / 등록 {grants}건",
            "award_value": "총 {total}건",
        }
    return {
        "document": "Public CV",
        "profile": "Profile",
        "timeline": "Experience and Education",
        "capabilities": "Usage-based Engineering Experience",
        "research": "Research and Public Evidence",
        "signals": "Achievement Signals",
        "patents": "Patents",
        "awards": "Awards",
        "selected": "Selected awards",
        "languages": "Languages",
        "projects": "Representative Work Scope",
        "source": "Two-page CV using only public facts approved on 2026-08-16.",
        "patent_value": "{applications} applications / {grants} grants",
        "award_value": "{total} total",
    }


def generate_cv_pdf(dependencies: dict[str, Any], payload: dict[str, Any], locale: str, output: Path) -> None:
    cv = payload["cv"]
    identity = localized(cv["identity"], locale)
    labels = cv_labels(locale)
    doc = TechnicalDocument(dependencies, output, f"{identity['displayName']} - CV", identity["headline"], locale, 2)
    width = doc.right - doc.left

    # Page 1
    doc.begin_page(1, labels["document"])
    y = doc.top - 30
    doc.label(labels["profile"], doc.left, y)
    y = doc.text(identity["displayName"], doc.left, y - 32, width, size=27,
                 font="MalgunGothic-Bold", leading=34, max_lines=1)
    y = doc.text(identity["headline"], doc.left, y - 4, width, size=14,
                 font="MalgunGothic-Bold", leading=20, max_lines=2) - 10
    y = doc.text(identity["summary"], doc.left, y, width, size=9.2,
                 leading=14, color="muted", max_lines=5) - 8
    contact_x = doc.left
    for contact in cv["contacts"]:
        contact_x += doc.link(f"{contact['label']}: {contact['value']}", contact["href"], contact_x, y, 7.5) + 16
    y -= 34
    doc.canvas.setStrokeColor(doc.colors["ink"])
    doc.canvas.line(doc.left, y, doc.right, y)
    y -= 22
    doc.label(labels["timeline"], doc.left, y)
    y -= 22
    for entry in cv["timeline"]:
        entry_copy = localized(entry, locale)
        doc.canvas.setStrokeColor(doc.colors["line"])
        doc.canvas.line(doc.left, y + 5, doc.right, y + 5)
        doc.text(entry["period"], doc.left, y - 10, 104, size=8,
                 font="MalgunGothic-Bold", leading=12, max_lines=2)
        doc.text(entry["organization"], doc.left + 112, y - 10, 155, size=9,
                 font="MalgunGothic-Bold", leading=13, max_lines=2)
        role_y = doc.text(entry_copy["role"], doc.left + 275, y - 10, width - 275,
                          size=8.5, font="MalgunGothic-Bold", leading=12, max_lines=2)
        doc.text(entry_copy["summary"], doc.left + 275, role_y - 2, width - 275,
                 size=7.2, leading=10.5, color="muted", max_lines=3)
        y -= 68
    y -= 10
    doc.label(labels["capabilities"], doc.left, y)
    y -= 22
    column_width = (width - 12) / 2
    for index, capability in enumerate(cv["capabilities"]):
        capability_copy = localized(capability, locale)
        x = doc.left + (index % 2) * (column_width + 12)
        box_y = y - (index // 2) * 78
        doc.canvas.setFillColor(doc.colors["soft"])
        doc.canvas.rect(x, box_y - 66, column_width, 66, fill=1, stroke=0)
        doc.text(capability_copy["title"], x + 10, box_y - 18, column_width - 20,
                 size=8.5, font="MalgunGothic-Bold", leading=12, max_lines=2)
        doc.text(capability_copy["body"], x + 10, box_y - 41, column_width - 20,
                 size=6.9, leading=10, color="muted", max_lines=3)
    doc.finish_page()

    # Page 2
    doc.begin_page(2, labels["document"])
    y = doc.heading(labels["research"], doc.top - 30, 20)
    for research in cv["research"]:
        doc.canvas.setStrokeColor(doc.colors["line"])
        doc.canvas.rect(doc.left, y - 96, width, 96, fill=0, stroke=1)
        doc.label(f"{research['year']} / {research['role']}", doc.left + 12, y - 18)
        title_y = doc.text(research["title"], doc.left + 12, y - 40, width - 24,
                           size=9.2, font="MalgunGothic-Bold", leading=13, max_lines=3)
        doc.text(research["venue"], doc.left + 12, title_y - 2, width - 24,
                 size=7.5, leading=11, color="muted", max_lines=2)
        if research.get("href"):
            doc.link("Public article", research["href"], doc.right - 88, y - 78, 7.5)
        y -= 106
    y -= 4
    doc.label(labels["signals"], doc.left, y)
    y -= 24
    achievements = cv["achievements"]
    signal_items = [
        (labels["patents"], labels["patent_value"].format(
            applications=achievements["patentApplications"], grants=achievements["patentGrants"])),
        (labels["awards"], labels["award_value"].format(total=achievements["awardTotal"])),
        (labels["languages"], " / ".join(item["translations"][locale] for item in cv["languages"])),
    ]
    signal_width = (width - 20) / 3
    for index, (label, value) in enumerate(signal_items):
        x = doc.left + index * (signal_width + 10)
        doc.canvas.setFillColor(doc.colors["soft"])
        doc.canvas.rect(x, y - 72, signal_width, 72, fill=1, stroke=0)
        doc.label(label, x + 10, y - 18)
        doc.text(value, x + 10, y - 42, signal_width - 20, size=8.5,
                 font="MalgunGothic-Bold", leading=12, max_lines=3)
    y -= 92
    doc.label(labels["selected"], doc.left, y)
    y -= 21
    for award in achievements["selectedAwards"]:
        doc.text(f"{award['year']}  {award['translations'][locale]}", doc.left, y, width,
                 size=8.3, leading=12, max_lines=2)
        y -= 20
    y -= 4
    doc.label(labels["projects"], doc.left, y)
    y -= 20
    project_titles = [localized(project, locale)["shortTitle"] for project in payload["projects"]]
    y = doc.text(" / ".join(project_titles), doc.left, y, width, size=8.2,
                 leading=12, color="muted", max_lines=4) - 8
    doc.text(labels["source"], doc.left, y, width, size=7.5, leading=11, color="muted", max_lines=2)
    doc.finish_page()
    doc.save()


def validate_pdf(dependencies: dict[str, Any], file_path: Path, expected_pages: int,
                 expected_name: str) -> dict[str, Any]:
    reader = dependencies["PdfReader"](str(file_path))
    require(len(reader.pages) == expected_pages, f"{file_path.name}: expected {expected_pages} pages.")
    metadata = reader.metadata or {}
    require(metadata.get("/Author") == "Jinmin Kim", f"{file_path.name}: invalid author metadata.")
    require(metadata.get("/Creator") == "Jinmin Kim Portfolio PDF Generator",
            f"{file_path.name}: invalid creator metadata.")
    require(metadata.get("/Producer") == "Jinmin Kim Portfolio PDF Generator",
            f"{file_path.name}: invalid producer metadata.")
    extracted = "\n".join(page.extract_text() or "" for page in reader.pages)
    require(clean_text(expected_name) in clean_text(extracted), f"{file_path.name}: title/name did not extract.")
    for number in range(1, expected_pages + 1):
        require(f"{number} / {expected_pages}" in extracted, f"{file_path.name}: missing page number {number}.")
    require("‑" not in extracted, f"{file_path.name}: non-ASCII hyphen detected.")
    require(not re.search(r"(?:^|[\s\"'(])(?:[A-Za-z]:[\\/]|\\\\)|file://|OneDrive|private[\\/]raw", extracted, re.IGNORECASE),
            f"{file_path.name}: extracted text exposes a private path.")
    link_count = 0
    for page in reader.pages:
        annotations = page.get("/Annots") or []
        for annotation_ref in annotations:
            annotation = annotation_ref.get_object()
            action = annotation.get("/A")
            if action and action.get("/URI"):
                link_count += 1
    require(link_count > 0, f"{file_path.name}: no public link annotation.")
    attachments = getattr(reader, "attachments", {})
    require(not attachments, f"{file_path.name}: hidden attachment detected.")
    return {"pages": expected_pages, "links": link_count, "characters": len(extracted)}


def render_cv_previews(dependencies: dict[str, Any], cv_pdf_paths: dict[str, Path],
                       cv_asset_root: Path) -> list[dict[str, Any]]:
    fitz = dependencies["fitz"]
    Image = dependencies["Image"]
    previews: list[dict[str, Any]] = []
    for locale in LOCALES:
        document = fitz.open(str(cv_pdf_paths[locale]))
        try:
            require(len(document) == 2, f"CV preview source for {locale} must contain two pages.")
            for index, page in enumerate(document):
                pixmap = page.get_pixmap(matrix=fitz.Matrix(150 / 72, 150 / 72), alpha=False)
                name = f"jinmin-kim-cv-{locale}-page-{index + 1}.png"
                preview = cv_asset_root / name
                pixmap.save(str(preview))
                with Image.open(preview) as image:
                    image.verify()
                with Image.open(preview) as image:
                    width, height = image.size
                require(width > 0 and height > 0, f"{name}: invalid preview dimensions.")
                previews.append({
                    "path": f"assets/cv/{name}",
                    "kind": "cv-preview",
                    "locale": locale,
                    "page": index + 1,
                    "width": width,
                    "height": height,
                    "bytes": preview.stat().st_size,
                    "sha256": sha256(preview),
                })
        finally:
            document.close()
    return previews


def render_reviews(dependencies: dict[str, Any], pdf_paths: list[Path], review_dir: Path) -> dict[str, Any]:
    fitz = dependencies["fitz"]
    Image = dependencies["Image"]
    ImageDraw = dependencies["ImageDraw"]
    pages_dir = review_dir / "pages"
    sheets_dir = review_dir / "contact-sheets"
    pages_dir.mkdir(parents=True, exist_ok=True)
    sheets_dir.mkdir(parents=True, exist_ok=True)
    for directory in [pages_dir, sheets_dir]:
        for existing in directory.glob("*.png"):
            existing.unlink()

    rendered: list[dict[str, Any]] = []
    page_total = 0
    for pdf_path in pdf_paths:
        document = fitz.open(str(pdf_path))
        page_images: list[Path] = []
        for index, page in enumerate(document):
            pixmap = page.get_pixmap(matrix=fitz.Matrix(120 / 72, 120 / 72), alpha=False)
            output = pages_dir / f"{pdf_path.stem}-page-{index + 1:02d}.png"
            pixmap.save(str(output))
            page_images.append(output)
            page_total += 1
        document.close()

        opened = [Image.open(image).convert("RGB") for image in page_images]
        thumb_width = 560
        thumbs = []
        for image in opened:
            ratio = thumb_width / image.width
            thumbs.append(image.resize((thumb_width, int(image.height * ratio)), Image.Resampling.LANCZOS))
        columns = 2
        rows = (len(thumbs) + columns - 1) // columns
        margin = 24
        label_height = 28
        cell_height = max(image.height for image in thumbs) + label_height
        sheet = Image.new("RGB", (columns * thumb_width + (columns + 1) * margin,
                                  rows * cell_height + (rows + 1) * margin), "#dfe5e2")
        draw = ImageDraw.Draw(sheet)
        for index, image in enumerate(thumbs):
            x = margin + (index % columns) * (thumb_width + margin)
            y = margin + (index // columns) * cell_height
            sheet.paste(image, (x, y + label_height))
            draw.text((x, y + 5), f"{pdf_path.name} / page {index + 1}", fill="#101715")
        sheet_path = sheets_dir / f"{pdf_path.stem}.png"
        sheet.save(sheet_path, optimize=True)
        for image in opened + thumbs:
            image.close()
        sheet.close()
        rendered.append({"pdf": pdf_path.name, "pages": len(page_images), "contactSheet": sheet_path.name})

    manifest = {"renderer": "PyMuPDF fallback", "dpi": 120, "pageCount": page_total, "documents": rendered}
    (review_dir / "review-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def artifact_record(file_path: Path, relative_path: str, kind: str, **fields: Any) -> dict[str, Any]:
    return {
        "path": relative_path,
        "kind": kind,
        **fields,
        "bytes": file_path.stat().st_size,
        "sha256": sha256(file_path),
    }


def validate_staged_publication(dependencies: dict[str, Any], output_dir: Path,
                                project_assets: Path, cv_assets: Path,
                                manifest: dict[str, Any]) -> None:
    expected_project_names = {f"{slug}-{locale}.pdf" for slug in EXPECTED_SLUGS for locale in LOCALES}
    expected_cv_names = {f"jinmin-kim-cv-{locale}.pdf" for locale in LOCALES}
    expected_preview_names = {
        f"jinmin-kim-cv-{locale}-page-{page}.png" for locale in LOCALES for page in [1, 2]
    }
    require({item.name for item in output_dir.iterdir()} == expected_project_names | expected_cv_names | {"manifest.json"},
            "Staged output/pdf contains an unexpected or missing artifact.")
    require({item.name for item in project_assets.iterdir()} == expected_project_names,
            "Staged assets/pdfs contains an unexpected or missing artifact.")
    require({item.name for item in cv_assets.iterdir()} == expected_cv_names | expected_preview_names,
            "Staged assets/cv contains an unexpected or missing artifact.")
    manifest_path = output_dir / "manifest.json"
    require(json.loads(manifest_path.read_text(encoding="utf-8")) == manifest,
            "Staged PDF manifest did not round-trip.")
    roots = {
        "output/pdf/": output_dir,
        "assets/pdfs/": project_assets,
        "assets/cv/": cv_assets,
    }
    require(len(manifest["artifacts"]) == 32, "Staged PDF manifest must track exactly 32 artifacts.")
    for artifact in manifest["artifacts"]:
        prefix = next((value for value in roots if artifact["path"].startswith(value)), None)
        require(prefix is not None, f"Manifest artifact has an invalid path: {artifact['path']}.")
        file_path = roots[prefix] / artifact["path"][len(prefix):]
        require(file_path.is_file(), f"Manifest artifact is missing: {artifact['path']}.")
        require(file_path.stat().st_size == artifact["bytes"] and sha256(file_path) == artifact["sha256"],
                f"Manifest artifact checksum mismatch: {artifact['path']}.")
        if artifact["kind"] == "cv-preview":
            with dependencies["Image"].open(file_path) as image:
                require(image.size == (artifact["width"], artifact["height"]),
                        f"Manifest preview dimensions mismatch: {artifact['path']}.")
                image.verify()
        else:
            reader = dependencies["PdfReader"](str(file_path))
            require(len(reader.pages) == artifact["pages"],
                    f"Manifest PDF page mismatch: {artifact['path']}.")


def atomic_swap_directories(publications: list[tuple[Path, Path]]) -> None:
    token = uuid.uuid4().hex
    states: list[tuple[Path, Path | None]] = []
    try:
        for target, staged in publications:
            backup = target.parent / f".{target.name}.backup-{token}"
            had_target = target.exists()
            if had_target:
                target.rename(backup)
            try:
                staged.rename(target)
            except Exception:
                if had_target and backup.exists():
                    backup.rename(target)
                raise
            states.append((target, backup if had_target else None))
    except Exception as error:
        for target, backup in reversed(states):
            if target.exists():
                shutil.rmtree(target)
            if backup and backup.exists():
                backup.rename(target)
        raise RuntimeError(f"Atomic PDF publication failed; previous artifacts restored: {error}") from error
    for _, backup in states:
        if backup and backup.exists():
            shutil.rmtree(backup)


def generate(payload: dict[str, Any], dependencies: dict[str, Any], output_dir: Path,
             publish_root: Path, review_dir: Path | None) -> dict[str, Any]:
    project_assets = publish_root / "assets" / "pdfs"
    cv_assets = publish_root / "assets" / "cv"
    targets = [output_dir, project_assets, cv_assets]
    token = uuid.uuid4().hex
    stages: list[Path] = []
    for target in targets:
        target.parent.mkdir(parents=True, exist_ok=True)
        stage = target.parent / f".{target.name}.stage-{token}"
        stage.mkdir()
        stages.append(stage)
    staged_output, staged_projects, staged_cv = stages
    expected_names = [f"{slug}-{locale}.pdf" for slug in EXPECTED_SLUGS for locale in LOCALES]
    expected_names += [f"jinmin-kim-cv-{locale}.pdf" for locale in LOCALES]
    documents: list[dict[str, Any]] = []
    artifacts: list[dict[str, Any]] = []
    try:
        for project in payload["projects"]:
            for locale in LOCALES:
                name = f"{project['slug']}-{locale}.pdf"
                output = staged_output / name
                generate_project_pdf(dependencies, payload, project, locale, output)
                qa = validate_pdf(dependencies, output, 6, localized(project, locale)["title"])
                published = staged_projects / name
                shutil.copyfile(output, published)
                require(sha256(output) == sha256(published), f"{name}: staged checksum mismatch.")
                documents.append({
                    "name": name, "kind": "project", "slug": project["slug"], "locale": locale,
                    "pages": qa["pages"], "links": qa["links"], "characters": qa["characters"],
                    "bytes": output.stat().st_size, "sha256": sha256(output)
                })
                artifacts.append(artifact_record(
                    output, f"output/pdf/{name}", "project-pdf", slug=project["slug"],
                    locale=locale, pages=qa["pages"]
                ))
                artifacts.append(artifact_record(
                    published, f"assets/pdfs/{name}", "project-pdf", slug=project["slug"],
                    locale=locale, pages=qa["pages"]
                ))

        cv_pdf_paths: dict[str, Path] = {}
        for locale in LOCALES:
            name = f"jinmin-kim-cv-{locale}.pdf"
            output = staged_output / name
            generate_cv_pdf(dependencies, payload, locale, output)
            qa = validate_pdf(dependencies, output, 2, localized(payload["cv"]["identity"], locale)["displayName"])
            published = staged_cv / name
            shutil.copyfile(output, published)
            require(sha256(output) == sha256(published), f"{name}: staged checksum mismatch.")
            cv_pdf_paths[locale] = published
            documents.append({
                "name": name, "kind": "cv", "locale": locale,
                "pages": qa["pages"], "links": qa["links"], "characters": qa["characters"],
                "bytes": output.stat().st_size, "sha256": sha256(output)
            })
            artifacts.append(artifact_record(
                output, f"output/pdf/{name}", "cv-pdf", locale=locale, pages=qa["pages"]
            ))
            artifacts.append(artifact_record(
                published, f"assets/cv/{name}", "cv-pdf", locale=locale, pages=qa["pages"]
            ))

        artifacts.extend(render_cv_previews(dependencies, cv_pdf_paths, staged_cv))
        artifacts.sort(key=lambda artifact: artifact["path"])
        manifest = {
            "schemaVersion": 2,
            "sourceDigest": payload["sourceDigest"],
            "generator": "scripts/generate-portfolio-pdfs.py",
            "documents": documents,
            "artifacts": artifacts,
        }
        (staged_output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        validate_staged_publication(dependencies, staged_output, staged_projects, staged_cv, manifest)
        atomic_swap_directories(list(zip(targets, stages)))
    finally:
        for stage in stages:
            if stage.exists():
                shutil.rmtree(stage)

    if review_dir:
        review_dir.mkdir(parents=True, exist_ok=True)
        final_paths = [output_dir / name for name in expected_names]
        manifest["review"] = render_reviews(dependencies, final_paths, review_dir)
    return manifest


def main(argv: list[str]) -> int:
    options = parse_arguments(argv)
    payload = load_export(options.input.resolve())
    if options.validate_only:
        print(f"PDF input validation passed: {len(payload['projects'])} projects, 2 locales, public CV {payload['cv']['version']}.")
        return 0
    dependencies = import_pdf_dependencies()
    register_fonts(dependencies, options.font_regular.resolve(), options.font_bold.resolve())
    manifest = generate(
        payload,
        dependencies,
        options.output_dir.resolve(),
        options.publish_root.resolve(),
        options.review_dir.resolve() if options.review_dir else None,
    )
    review_pages = manifest.get("review", {}).get("pageCount", 0)
    print(f"Generated {len(manifest['documents'])} PDFs ({sum(item['pages'] for item in manifest['documents'])} pages); rendered {review_pages} review pages.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except (IndexError, KeyError, OSError, RuntimeError, TypeError, ValueError) as error:
        print(f"PDF generation failed: {error}", file=sys.stderr)
        raise SystemExit(1)
