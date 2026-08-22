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
import math
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
    "respiratory-surface-guidance",
    "skadi-tracking-software",
    "unmanned-forklift",
    "ai-build-lab",
]
GENERATOR_VERSION = "3.1"
GENERATOR_PUBLIC_PATH = "scripts/generate-portfolio-pdfs.py"
EXPECTED_DIAGRAM_KIND = {
    "surgical-navigation": "system-flow",
    "mandibular-fracture": "optimization-loop",
    "life-careverse": "sync-topology",
    "rtms-navigation": "navigation-loop",
    "respiratory-surface-guidance": "surface-gating-chain",
    "skadi-tracking-software": "tracking-sdk-stack",
    "unmanned-forklift": "sensor-convergence",
    "ai-build-lab": "product-loop",
}
LOCALES = ["ko", "en"]
STORY_LAYOUTS = {"wide", "grid"}
STORY_DIRECTIONS = {"forward", "bidirectional"}
STORY_MEDIA_KEYS = {"id", "poster", "preload", "publicPath", "status", "translations", "type", "videoPolicy"}
VIDEO_POLICY_KEYS = {
    "codec", "height", "maxBytes", "requireFastStart", "requireNoAudio",
    "targetDurationSeconds", "toleranceSeconds", "width",
}
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
    # The leading lookbehind keeps KIPO patent numbers (10-2019-0100328) from reading as 010-xxxx-xxxx.
    ("phone number", re.compile(r"(?<![\d-])(?:\+82[\s()./·-]*\(?0?10\)?|\(?010\)?)[\s()./·-]*\d{3,4}[\s()./·-]*\d{4}(?!\d)", re.I)),
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


def validate_video_policy(value: Any, label: str) -> None:
    policy = require_object(value, f"{label} videoPolicy")
    require(set(policy) == VIDEO_POLICY_KEYS,
            f"{label} videoPolicy must contain exactly the canonical keys.")
    require(policy.get("codec") == "h264", f"{label} videoPolicy codec must be h264.")
    max_bytes = policy.get("maxBytes")
    require(isinstance(max_bytes, int) and not isinstance(max_bytes, bool) and 1 <= max_bytes <= 100_000_000,
            f"{label} videoPolicy maxBytes must be an integer from 1 through 100000000.")
    for field in ["targetDurationSeconds", "toleranceSeconds"]:
        number = policy.get(field)
        require(isinstance(number, (int, float)) and not isinstance(number, bool) and math.isfinite(number),
                f"{label} videoPolicy {field} must be finite.")
    require(policy["targetDurationSeconds"] > 0,
            f"{label} videoPolicy targetDurationSeconds must be positive.")
    require(0 <= policy["toleranceSeconds"] <= 1,
            f"{label} videoPolicy toleranceSeconds must be from 0 through 1.")
    for field in ["width", "height"]:
        dimension = policy.get(field)
        require(isinstance(dimension, int) and not isinstance(dimension, bool) and dimension > 0,
                f"{label} videoPolicy {field} must be a positive integer.")
    require(policy.get("requireFastStart") is True and policy.get("requireNoAudio") is True,
            f"{label} videoPolicy requirements must both be true.")


def validate_story_media_path(item: dict[str, Any], label: str, slug: str) -> None:
    media_type = item.get("type")
    status = item.get("status")
    require(media_type in {"image", "video"}, f"{label} must be image or video media.")
    require(status in {"approved", "pending-approval"}, f"{label} has an unknown media status.")
    public_path = item.get("publicPath")
    if status == "pending-approval":
        require(public_path is None, f"{label} pending-approval media must not declare a public path.")
    else:
        extension = "png" if media_type == "image" else "mp4"
        require(isinstance(public_path, str) and bool(re.fullmatch(
            rf"assets/projects/{re.escape(slug)}/[a-z0-9][a-z0-9._/-]*\.{extension}", public_path
        )) and all(segment not in {"", ".", ".."} for segment in public_path.split("/")),
                f"{label} approved media requires a repository-relative project .{extension} path.")
    if "preload" in item:
        require(media_type == "video" and item.get("preload") in {"none", "metadata"},
                f"{label} preload is allowed only for video as none or metadata.")
    if "videoPolicy" in item:
        require(media_type == "video", f"{label} videoPolicy is allowed only for video.")
        validate_video_policy(item.get("videoPolicy"), label)


def validate_system_flow_diagram(value: Any, label: str) -> dict[str, Any]:
    diagram = require_object(value, f"{label} system-flow diagram")
    require(set(diagram) == {"boundary", "edges", "kind", "nodes", "translations"},
            f"{label} system-flow diagram must contain exactly boundary, edges, kind, nodes, and translations.")
    require(diagram.get("kind") == "system-flow", f"{label} diagram kind must be system-flow.")
    require(diagram.get("boundary") == "prototype", f"{label} diagram boundary must be prototype.")
    validate_translation_record(diagram, f"{label} diagram", ["title", "caption", "boundaryLabel"])
    nodes = require_array(diagram.get("nodes"), f"{label} diagram nodes")
    require(len(nodes) >= 2, f"{label} system-flow diagram requires at least two nodes.")
    node_keys: list[str] = []
    for node_index, node_value in enumerate(nodes, start=1):
        node = require_object(node_value, f"{label} diagram node {node_index}")
        require(set(node) == {"key", "translations"},
                f"{label} diagram node {node_index} must contain exactly key and translations.")
        key = require_text(node.get("key"), f"{label} diagram node {node_index} key")
        require(key not in node_keys, f"{label} system-flow diagram requires uniquely keyed nodes.")
        node_keys.append(key)
        validate_translation_record(node, f"{label} diagram node {node_index}", ["label", "detail"])
    edges = require_array(diagram.get("edges"), f"{label} diagram edges", len(nodes) - 1)
    for edge_index, edge_value in enumerate(edges, start=1):
        edge = require_object(edge_value, f"{label} diagram edge {edge_index}")
        require(set(edge) == {"direction", "from", "to", "translations"},
                f"{label} diagram edge {edge_index} must contain exactly direction, from, to, and translations.")
        require(edge.get("from") == node_keys[edge_index - 1] and edge.get("to") == node_keys[edge_index],
                f"{label} diagram edge {edge_index} must follow the declared node order.")
        require(edge.get("direction") in STORY_DIRECTIONS,
                f"{label} diagram edge {edge_index} direction must be forward or bidirectional.")
        validate_translation_record(edge, f"{label} diagram edge {edge_index}", ["label"])
    return diagram


def validate_story_sections(project: dict[str, Any], slug: str) -> tuple[list[str], dict[str, dict[str, Any]]]:
    if "storySections" not in project:
        return [], {}
    sections = require_array(project.get("storySections"), f"PDF input project {slug} storySections")
    require(bool(sections), f"PDF input project {slug} storySections must be a non-empty array.")
    section_keys: list[str] = []
    story_media: dict[str, dict[str, Any]] = {}
    seen_media_ids: set[str] = set()
    source_media = project.get("media") if isinstance(project.get("media"), dict) else {}
    for slot in ["lead", "poster"]:
        item = source_media.get(slot)
        if isinstance(item, dict) and isinstance(item.get("id"), str):
            seen_media_ids.add(item["id"])
    for slot in ["references", "gallery"]:
        items = source_media.get(slot)
        for item in items if isinstance(items, list) else []:
            if isinstance(item, dict) and isinstance(item.get("id"), str):
                seen_media_ids.add(item["id"])

    for section_index, section_value in enumerate(sections, start=1):
        label = f"PDF input project {slug} story section {section_index}"
        section = require_object(section_value, label)
        key = require_text(section.get("key"), f"{label} key")
        require(key not in section_keys, f"{label} key is duplicated: {key}.")
        section_keys.append(key)
        require(section.get("layout") in STORY_LAYOUTS, f"{label} has an unsupported layout.")
        translations = require_object(section.get("translations"), f"{label} translations")
        require(set(translations) == set(LOCALES), f"{label} translations must contain exactly ko and en.")
        for locale in LOCALES:
            copy = require_object(translations.get(locale), f"{label} {locale} translation")
            require_text(copy.get("heading"), f"{label} {locale} heading")
            body = copy.get("body")
            items = copy.get("items")
            valid_body = isinstance(body, str) and bool(body.strip())
            valid_items = (isinstance(items, list) and bool(items)
                           and all(isinstance(item, str) and bool(item.strip()) for item in items))
            require(valid_body or valid_items, f"{label} {locale} requires body or list copy.")
            if items is not None:
                require(valid_items, f"{label} {locale} list copy must contain non-empty strings.")
        media = section.get("media", [])
        require(isinstance(media, list), f"{label} media must be an array.")
        for media_index, media_value in enumerate(media, start=1):
            media_label = f"{label} media {media_index}"
            item = require_object(media_value, media_label)
            require(set(item).issubset(STORY_MEDIA_KEYS), f"{media_label} contains an undeclared field.")
            identifier = require_text(item.get("id"), f"{media_label} id")
            require(identifier not in seen_media_ids, f"{media_label} id is duplicated: {identifier}.")
            seen_media_ids.add(identifier)
            validate_story_media_path(item, media_label, slug)
            validate_translation_record(item, media_label, ["caption", "alt"])
            poster = item.get("poster")
            if poster is not None:
                poster = require_object(poster, f"{media_label} poster")
                poster_id = require_text(poster.get("id"), f"{media_label} poster id")
                require(poster_id not in seen_media_ids, f"{media_label} poster id is duplicated: {poster_id}.")
                seen_media_ids.add(poster_id)
                validate_story_media_path(poster, f"{media_label} poster", slug)
                require(poster.get("type") == "image", f"{media_label} poster must be image media.")
            if item.get("type") == "video" and item.get("status") == "approved":
                require(isinstance(poster, dict) and poster.get("type") == "image" and poster.get("status") == "approved",
                        f"{media_label} approved story video requires an approved image poster.")
            story_media[identifier] = item
            if isinstance(poster, dict):
                story_media[poster["id"]] = poster
        if "diagram" in section:
            validate_system_flow_diagram(section.get("diagram"), label)
    return section_keys, story_media


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
    require(cv.get("version") == "2026-08-22", "PDF input requires the approved public CV version.")
    identity = require_object(cv.get("identity"), "PDF input CV identity")
    require(identity.get("name") == "Jinmin Kim", "PDF input CV identity must be Jinmin Kim.")
    validate_localized_strings(identity.get("location"), "PDF input CV identity location")
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

    education = require_array(cv.get("education"), "PDF input CV education", 2)
    for index, value in enumerate(education, start=1):
        entry = require_object(value, f"PDF input CV education entry {index}")
        require_text(entry.get("period"), f"PDF input CV education entry {index} period")
        require_text(entry.get("organization"), f"PDF input CV education entry {index} organization")
        validate_translation_record(entry, f"PDF input CV education entry {index}", ["degree"])
        for locale in LOCALES:
            notes = entry["translations"][locale].get("notes")
            require(isinstance(notes, list) and notes and all(isinstance(note, str) and note.strip() for note in notes),
                    f"PDF input CV education entry {index} {locale} notes must be a non-empty string list.")

    experience = require_array(cv.get("experience"), "PDF input CV experience", 1)
    for index, value in enumerate(experience, start=1):
        entry = require_object(value, f"PDF input CV experience entry {index}")
        require_text(entry.get("period"), f"PDF input CV experience entry {index} period")
        require_text(entry.get("organization"), f"PDF input CV experience entry {index} organization")
        validate_translation_record(entry, f"PDF input CV experience entry {index}", ["role", "context"])
        areas = require_array(entry.get("areas"), f"PDF input CV experience entry {index} areas", 4)
        for area_index, area_value in enumerate(areas, start=1):
            area = require_object(area_value, f"PDF input CV experience area {area_index}")
            validate_translation_record(area, f"PDF input CV experience area {area_index}", ["title"])
            for locale in LOCALES:
                items = area["translations"][locale].get("items")
                require(isinstance(items, list) and items and all(isinstance(item, str) and item.strip() for item in items),
                        f"PDF input CV experience area {area_index} {locale} items must be a non-empty string list.")

    publications = require_array(cv.get("publications"), "PDF input CV publications", 7)
    for index, value in enumerate(publications, start=1):
        publication = require_object(value, f"PDF input CV publication {index}")
        require_text(publication.get("year"), f"PDF input CV publication {index} year")
        validate_translation_record(publication, f"PDF input CV publication {index}", ["title", "venue", "role"])
        if "href" in publication:
            href = require_text(publication.get("href"), f"PDF input CV publication {index} href")
            require(href.startswith("https://"), f"PDF input CV publication {index} href must use HTTPS.")

    patents = require_array(cv.get("patents"), "PDF input CV patents", 7)
    granted = 0
    for index, value in enumerate(patents, start=1):
        patent = require_object(value, f"PDF input CV patent {index}")
        status = require_text(patent.get("status"), f"PDF input CV patent {index} status")
        require(status in {"filed", "granted"}, f"PDF input CV patent {index} status must be filed or granted.")
        granted += 1 if status == "granted" else 0
        require(require_text(patent.get("group"), f"PDF input CV patent {index} group") in {"work", "undergraduate"},
                f"PDF input CV patent {index} group must be work or undergraduate.")
        require(re.fullmatch(r"10-\d{4}-\d{7}", require_text(patent.get("number"), f"PDF input CV patent {index} number")),
                f"PDF input CV patent {index} number must be a KIPO application number.")
        require_text(patent.get("filed"), f"PDF input CV patent {index} filed")
        validate_translation_record(patent, f"PDF input CV patent {index}", ["title"])
    require(granted == 3, "PDF input CV patents must record exactly 3 granted entries.")

    awards = require_array(cv.get("awards"), "PDF input CV awards", 9)
    for index, value in enumerate(awards, start=1):
        award = require_object(value, f"PDF input CV award {index}")
        require_text(award.get("year"), f"PDF input CV award {index} year")
        require(require_text(award.get("group"), f"PDF input CV award {index} group") in {"academic", "undergraduate"},
                f"PDF input CV award {index} group must be academic or undergraduate.")
        validate_translation_record(award, f"PDF input CV award {index}", ["title", "organization"])

    skills = require_array(cv.get("skills"), "PDF input CV skills", 5)
    for index, value in enumerate(skills, start=1):
        validate_translation_record(require_object(value, f"PDF input CV skill {index}"),
                                    f"PDF input CV skill {index}", ["category", "items"])

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

    tiers = require_array(payload.get("tiers"), "PDF input tiers", 4)
    tier_keys: set[str] = set()
    for index, value in enumerate(tiers, start=1):
        tier = require_object(value, f"PDF input tier {index}")
        key = require_text(tier.get("key"), f"PDF input tier {index} key")
        tier_keys.add(key)
        validate_translation_record(tier, f"PDF input tier {index}", ["label"])

    projects = require_array(payload.get("projects"), "PDF input projects", len(EXPECTED_SLUGS))
    project_slugs: list[str] = []
    project_sequence_evidence: dict[str, str] = {}
    story_figure_contracts: dict[str, tuple[list[str], dict[str, dict[str, Any]]]] = {}
    seen_diagram_kinds: set[str] = set()
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
        if any(isinstance(project.get("translations", {}).get(locale), dict)
               and project["translations"][locale].get("roleLabel") is not None for locale in LOCALES):
            validate_translation_record(project, f"PDF input project {slug}", ["roleLabel"])

        story_keys, story_media = validate_story_sections(project, slug)

        blocks = require_array(project.get("blocks"), f"PDF input project {slug} blocks")
        block_keys: list[str] = []
        for block_index, block_value in enumerate(blocks, start=1):
            block = require_object(block_value, f"PDF input project {slug} block {block_index}")
            block_key = require_text(block.get("key"), f"PDF input project {slug} block {block_index} key")
            require(block_key not in block_keys, f"PDF input project {slug} block key is duplicated: {block_key}.")
            block_keys.append(block_key)
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

        if not story_keys:
            require(len(block_keys) >= 4, f"PDF input project {slug} must contain at least four structural blocks.")
        sequence = require_object(project.get("pdfSequence"), f"PDF input project {slug} PDF sequence")
        expected_sequence_keys = ({"middle", "evidenceId", "diagram", "figureIds"} if story_keys
                                  else {"middle", "evidenceId", "diagram"})
        require(set(sequence) == expected_sequence_keys,
                f"PDF input project {slug} PDF sequence must contain exactly the canonical fields.")
        middle = require_array(sequence.get("middle"), f"PDF input project {slug} PDF sequence middle", 4)
        for middle_index, section_key in enumerate(middle, start=1):
            require_text(section_key, f"PDF input project {slug} PDF sequence middle {middle_index}")
        known_middle_keys = story_keys if story_keys else block_keys
        require(len(set(middle)) == 4 and all(section_key in known_middle_keys for section_key in middle),
                f"PDF input project {slug} PDF sequence must reference exactly four distinct known sections.")
        evidence_id = require_text(sequence.get("evidenceId"), f"PDF input project {slug} PDF sequence evidenceId")
        media = require_object(project.get("media"), f"PDF input project {slug} media")
        lead = require_object(media.get("lead"), f"PDF input project {slug} lead media")
        require(evidence_id == require_text(lead.get("id"), f"PDF input project {slug} lead media id"),
                f"PDF input project {slug} PDF sequence evidenceId must reference lead media.")
        project_sequence_evidence[slug] = evidence_id
        case_layout = project.get("caseLayout")
        require(case_layout is None or case_layout in {"standard", "evidence-first"},
                f"PDF input project {slug} case layout must be standard or evidence-first.")
        if case_layout == "evidence-first":
            gallery = require_array(media.get("gallery"), f"PDF input project {slug} evidence-first gallery", 6)
            gallery_ids: set[str] = set()
            for gallery_index, gallery_value in enumerate(gallery, start=1):
                item = require_object(gallery_value, f"PDF input project {slug} gallery {gallery_index}")
                identifier = require_text(item.get("id"), f"PDF input project {slug} gallery {gallery_index} id")
                require(identifier not in gallery_ids, f"PDF input project {slug} gallery id is duplicated: {identifier}.")
                gallery_ids.add(identifier)
                require(item.get("type") == "image" and item.get("status") == "approved",
                        f"PDF input project {slug} evidence-first gallery must contain approved images.")
                validate_translation_record(item, f"PDF input project {slug} gallery {gallery_index}", ["caption", "alt"])

            steps = require_array(project.get("architectureSteps"),
                                  f"PDF input project {slug} architectureSteps", 4)
            require([step.get("key") if isinstance(step, dict) else None for step in steps]
                    == ["define", "open", "track", "apply"] and
                    [step.get("label") if isinstance(step, dict) else None for step in steps]
                    == ["Define", "Open", "Track", "Apply"],
                    f"PDF input project {slug} architecture steps must be Define, Open, Track, Apply in order.")
            for step_index, step_value in enumerate(steps, start=1):
                validate_translation_record(require_object(step_value, f"PDF input project {slug} architecture step {step_index}"),
                                            f"PDF input project {slug} architecture step {step_index}", ["description"])

            tracks = require_array(project.get("applicationTracks"),
                                   f"PDF input project {slug} applicationTracks", 2)
            require([(track.get("key"), track.get("kind")) if isinstance(track, dict) else (None, None)
                     for track in tracks] == [("medical", "primary"), ("industrial", "extension")],
                    f"PDF input project {slug} application tracks must be medical primary and industrial extension.")
            for track_index, track_value in enumerate(tracks, start=1):
                track = require_object(track_value, f"PDF input project {slug} application track {track_index}")
                track_evidence = require_array(track.get("evidenceIds"),
                                               f"PDF input project {slug} application track {track_index} evidenceIds")
                require(bool(track_evidence)
                        and all(isinstance(identifier, str) and identifier in gallery_ids
                                for identifier in track_evidence)
                        and len(set(track_evidence)) == len(track_evidence),
                        f"PDF input project {slug} application track {track_index} must reference distinct gallery evidence.")
                validate_translation_record(track, f"PDF input project {slug} application track {track_index}",
                                            ["title", "summary", "ownedRole", "teamBoundary"])

            resources = require_array(project.get("publicResources"),
                                      f"PDF input project {slug} publicResources", 4)
            for resource_index, resource_value in enumerate(resources, start=1):
                resource = require_object(resource_value, f"PDF input project {slug} public resource {resource_index}")
                require(resource.get("type") in {"documentation", "product"},
                        f"PDF input project {slug} public resource {resource_index} has an invalid type.")
                href = require_text(resource.get("href"), f"PDF input project {slug} public resource {resource_index} href")
                require(href.startswith("https://") and "github.com" not in href.lower(),
                        f"PDF input project {slug} public resource {resource_index} must use a non-GitHub HTTPS URL.")
                validate_translation_record(resource, f"PDF input project {slug} public resource {resource_index}",
                                            ["title", "description"])
        diagram_contract = require_object(sequence.get("diagram"), f"PDF input project {slug} PDF sequence diagram")
        if story_keys:
            require(set(diagram_contract) == {"storySectionKey"},
                    f"PDF input project {slug} story PDF sequence diagram must contain exactly storySectionKey.")
            diagram_section_key = require_text(
                diagram_contract.get("storySectionKey"), f"PDF input project {slug} PDF sequence diagram storySectionKey"
            )
            diagram_section = next((section for section in project["storySections"]
                                    if section.get("key") == diagram_section_key), None)
            require(isinstance(diagram_section, dict) and isinstance(diagram_section.get("diagram"), dict),
                    f"PDF input project {slug} story PDF sequence diagram must resolve to a story section diagram.")
            diagram = diagram_section["diagram"]
            diagram_kind = require_text(diagram.get("kind"), f"PDF input project {slug} story diagram kind")
            require(diagram_kind == EXPECTED_DIAGRAM_KIND[slug],
                    f"PDF input project {slug} story diagram must be the expected system-flow kind.")
            figure_ids = require_array(sequence.get("figureIds"),
                                       f"PDF input project {slug} PDF sequence figureIds", 6)
            require(all(isinstance(identifier, str) and bool(identifier) for identifier in figure_ids)
                    and len(set(figure_ids)) == 6,
                    f"PDF input project {slug} PDF sequence figureIds must contain six unique ids.")
            for identifier in figure_ids:
                item = story_media.get(identifier)
                require(isinstance(item, dict) and isinstance(item.get("translations"), dict)
                        and item.get("status") == "approved" and item.get("type") in {"image", "video"},
                        f"PDF input project {slug} PDF sequence figureId {identifier} must reference approved story media.")
                if item.get("type") == "video":
                    poster = item.get("poster")
                    require(isinstance(poster, dict) and story_media.get(poster.get("id")) is poster
                            and poster.get("status") == "approved" and poster.get("type") == "image",
                            f"PDF input project {slug} PDF sequence video figure {identifier} requires its canonical approved poster.")
            story_figure_contracts[slug] = (figure_ids, story_media)
        else:
            diagram = diagram_contract
            require(set(diagram) == {"kind", "translations"},
                    f"PDF input project {slug} PDF sequence diagram must contain exactly kind and translations.")
            diagram_kind = require_text(diagram.get("kind"), f"PDF input project {slug} PDF sequence diagram kind")
            require(diagram_kind == EXPECTED_DIAGRAM_KIND[slug],
                    f"PDF input project {slug} has an invalid PDF sequence diagram kind.")
            diagram_translations = require_object(
                diagram.get("translations"), f"PDF input project {slug} PDF sequence diagram translations"
            )
            require(set(diagram_translations) == set(LOCALES),
                    f"PDF input project {slug} PDF sequence diagram translations must contain exactly ko and en.")
            for locale in LOCALES:
                diagram_copy = require_object(
                    diagram_translations.get(locale), f"PDF input project {slug} PDF sequence diagram {locale}"
                )
                require(set(diagram_copy) == {"title", "nodes"},
                        f"PDF input project {slug} PDF sequence diagram {locale} must contain title and nodes.")
                require_text(diagram_copy.get("title"), f"PDF input project {slug} PDF sequence diagram {locale} title")
                nodes = require_array(
                    diagram_copy.get("nodes"), f"PDF input project {slug} PDF sequence diagram {locale} nodes", 4
                )
                for node_index, node in enumerate(nodes, start=1):
                    require_text(node, f"PDF input project {slug} PDF sequence diagram {locale} node {node_index}")
        require(diagram_kind not in seen_diagram_kinds,
                f"PDF input project {slug} PDF sequence diagram kind must be unique.")
        seen_diagram_kinds.add(diagram_kind)

        links = require_array(project.get("links"), f"PDF input project {slug} links")
        for link_index, link_value in enumerate(links, start=1):
            link = require_object(link_value, f"PDF input project {slug} link {link_index}")
            href = require_text(link.get("href"), f"PDF input project {slug} link {link_index} href")
            require(href.startswith("https://"), f"PDF input project {slug} link {link_index} must use HTTPS.")
            validate_translation_record(link, f"PDF input project {slug} link {link_index}", ["label"])
    require(project_slugs == EXPECTED_SLUGS, "PDF input must contain the eight canonical projects in order.")

    evidence_entries = require_array(payload.get("evidence"), "PDF input evidence")
    evidence_ids: set[str] = set()
    evidence_by_id: dict[str, dict[str, Any]] = {}
    for index, value in enumerate(evidence_entries, start=1):
        entry = require_object(value, f"PDF input evidence entry {index}")
        for field in ["id", "project", "type", "state", "source", "note"]:
            require_text(entry.get(field), f"PDF input evidence entry {index} {field}")
        require(entry["id"] not in evidence_ids, f"PDF input evidence id is duplicated: {entry['id']}.")
        evidence_ids.add(entry["id"])
        evidence_by_id[entry["id"]] = entry
        require(entry["project"] in EXPECTED_SLUGS, f"PDF input evidence entry {index} has an unknown project.")
        require(entry["type"] in {"image", "video", "repository", "publication"},
                f"PDF input evidence entry {index} has an unknown type.")
        require(entry["state"] in {"pending-review", "approved-public", "excluded"},
                f"PDF input evidence entry {index} has an unknown state.")
        if entry["state"] != "approved-public":
            require(entry["source"] == "-", f"PDF input evidence entry {index} non-public source must be '-'.")
        elif entry["type"] in {"repository", "publication"}:
            require(entry["source"].startswith("https://"),
                    f"PDF input evidence entry {index} external source must use HTTPS.")
        else:
            extension = "png" if entry["type"] == "image" else "mp4"
            source_pattern = rf"assets/projects/{re.escape(entry['project'])}/[a-z0-9][a-z0-9._/-]*\.{extension}"
            source_segments = entry["source"].split("/")
            require(bool(re.fullmatch(source_pattern, entry["source"])) and
                    all(segment not in {"", ".", ".."} for segment in source_segments),
                    f"PDF input evidence entry {index} approved local source must stay below its project directory as a lower-case .{extension} file.")

    for slug, evidence_id in project_sequence_evidence.items():
        require(any(entry.get("id") == evidence_id and entry.get("project") == slug for entry in evidence_entries),
                f"PDF input project {slug} PDF sequence evidenceId is not registered for that project.")

    for slug, (figure_ids, story_media) in story_figure_contracts.items():
        for identifier in figure_ids:
            item = story_media[identifier]
            entry = evidence_by_id.get(identifier)
            require(isinstance(entry, dict) and entry.get("project") == slug
                    and entry.get("state") == "approved-public" and entry.get("type") == item.get("type")
                    and entry.get("source") == item.get("publicPath"),
                    f"PDF input project {slug} figure {identifier} must match registered approved public evidence.")
            if item.get("type") == "video":
                poster = item["poster"]
                poster_entry = evidence_by_id.get(poster["id"])
                require(isinstance(poster_entry, dict) and poster_entry.get("project") == slug
                        and poster_entry.get("state") == "approved-public" and poster_entry.get("type") == "image"
                        and poster_entry.get("source") == poster.get("publicPath"),
                        f"PDF input project {slug} video figure {identifier} poster must match registered approved public evidence.")

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


def normalized_text_source_sha256(file_path: Path) -> str:
    text = file_path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def parse_arguments(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate deterministic public portfolio PDFs.")
    parser.add_argument("--input", required=True, type=Path, help="Deterministic JSON exported by export-portfolio-data.cjs")
    parser.add_argument("--output-dir", type=Path, default=Path("output/pdf"), help="PDF-skill deliverable directory")
    parser.add_argument("--publish-root", type=Path, default=Path("."), help="Repository root containing assets/")
    parser.add_argument("--review-dir", type=Path, help="Ignored directory for all-page PNGs and contact sheets")
    parser.add_argument("--font-regular", type=Path, default=Path(r"C:\Windows\Fonts\malgun.ttf"))
    parser.add_argument("--font-bold", type=Path, default=Path(r"C:\Windows\Fonts\malgunbd.ttf"))
    parser.add_argument("--font-symbol", type=Path, default=Path(r"C:\Windows\Fonts\NotoSansKR-VF.ttf"))
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
        # Scholar palette, shared with the website: white paper, near-black ink, one blue accent.
        self.colors = {
            "paper": dependencies["HexColor"]("#FFFFFF"),
            "ink": dependencies["HexColor"]("#1A1A1A"),
            "muted": dependencies["HexColor"]("#555555"),
            "line": dependencies["HexColor"]("#E0E0E0"),
            "signal": dependencies["HexColor"]("#1A56DB"),
            "warm": dependencies["HexColor"]("#9A3412"),
            "soft": dependencies["HexColor"]("#F5F5F5"),
        }
        self.page_no = 1
        self.section_name = ""
        self.y = self.top

    def begin_page(self, number: int, section: str) -> None:
        c = self.canvas
        c.setFillColor(self.colors["paper"])
        c.rect(0, 0, self.width, self.height, fill=1, stroke=0)
        c.setStrokeColor(self.colors["line"])
        c.setLineWidth(0.7)
        c.line(self.left, self.top + 8, self.right, self.top + 8)
        c.setFillColor(self.colors["muted"])
        c.setFont("MalgunGothic", 7.5)
        c.drawString(self.left, self.top + 17, clean_text(section))
        c.drawRightString(self.right, self.top + 17, "Jinmin Kim / Public technical document")
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
        self.canvas.setFont("MalgunGothic-Bold", 8)
        self.canvas.drawString(x, y, clean_text(text))

    def section(self, label: Any, title: Any, body: Any, y: float, height: float,
                accent: str = "signal") -> float:
        self.canvas.setFillColor(self.colors["soft"])
        self.canvas.rect(self.left, y - height, self.right - self.left, height, fill=1, stroke=0)
        self.canvas.setFillColor(self.colors[accent])
        self.canvas.rect(self.left, y - height, 4, height, fill=1, stroke=0)
        self.label(label, self.left + 16, y - 22, accent)
        title_y = self.text(title, self.left + 16, y - 44, self.right - self.left - 32,
                            size=13, font="MalgunGothic-Bold", leading=18, max_lines=4)
        # Budget the body from the space the title actually consumed: a short title yields more
        # body lines, and a three-line title still leaves every drawn line inside the box.
        body_lines = max(1, int((title_y - 8 - (y - height)) / 15) + 1)
        self.text(body, self.left + 16, title_y - 4, self.right - self.left - 32,
                  size=9.5, leading=15, color="muted", max_lines=body_lines)
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

    # ---- flowing layout -----------------------------------------------------
    # Pages are not fixed panels any more: content is emitted top to bottom and a
    # page break happens only when the next element would cross the bottom margin.

    def start(self, section: str) -> None:
        self.section_name = section
        self.page_no = 1
        self.begin_page(1, section)
        self.y = self.top - 30

    def ensure(self, height: float) -> None:
        if self.y - height < self.bottom + 4:
            self.finish_page()
            self.page_no += 1
            self.begin_page(self.page_no, self.section_name)
            self.y = self.top - 30

    def rule(self, before: float = 12, after: float = 14) -> None:
        self.ensure(before + after)
        self.y -= before
        self.canvas.setStrokeColor(self.colors["line"])
        self.canvas.setLineWidth(0.7)
        self.canvas.line(self.left, self.y, self.right, self.y)
        self.y -= after

    def kicker(self, text: Any, color: str = "signal") -> None:
        value = clean_text(text)
        if not value:
            return
        self.ensure(18)
        self.label(value, self.left, self.y - 8, color)
        self.y -= 20

    def para(self, text: Any, size: float = 10, leading: float = 16,
             font: str = "MalgunGothic", color: str = "ink", gap: float = 12,
             indent: float = 0) -> None:
        width = self.right - self.left - indent
        lines = self.wrap(text, font, size, width)
        if not lines:
            return
        for line in lines:
            self.ensure(leading)
            self.canvas.setFillColor(self.colors[color])
            self.canvas.setFont(font, size)
            self.canvas.drawString(self.left + indent, self.y - size, line)
            self.y -= leading
        self.y -= gap

    def bullets(self, items: Iterable[Any], size: float = 10, leading: float = 16,
                color: str = "muted", gap: float = 12) -> None:
        for item in items:
            lines = self.wrap(item, "MalgunGothic", size, self.right - self.left - 16)
            for index, line in enumerate(lines):
                self.ensure(leading)
                self.canvas.setFillColor(self.colors[color])
                self.canvas.setFont("MalgunGothic", size)
                if index == 0:
                    self.canvas.drawString(self.left, self.y - size, "-")
                self.canvas.drawString(self.left + 16, self.y - size, line)
                self.y -= leading
        self.y -= gap

    def h2(self, text: Any) -> None:
        value = clean_text(text)
        if not value:
            return
        self.ensure(74)
        self.y -= 14
        self.canvas.setStrokeColor(self.colors["ink"])
        self.canvas.setLineWidth(0.9)
        self.canvas.line(self.left, self.y, self.right, self.y)
        self.y -= 20
        self.canvas.setFillColor(self.colors["ink"])
        self.canvas.setFont("MalgunGothic-Bold", 14)
        self.canvas.drawString(self.left, self.y - 14, value)
        self.y -= 28

    def h3(self, text: Any) -> None:
        value = clean_text(text)
        if not value:
            return
        self.ensure(30)
        self.canvas.setFillColor(self.colors["ink"])
        self.canvas.setFont("MalgunGothic-Bold", 11)
        self.canvas.drawString(self.left, self.y - 11, value)
        self.y -= 21

    def meta_line(self, pairs: list[tuple[str, str]]) -> None:
        parts = [f"{clean_text(label)} {clean_text(value)}" for label, value in pairs if clean_text(value)]
        if parts:
            self.para("   |   ".join(parts), size=9, leading=14, color="muted", gap=6)

    def figure(self, path: Any, number_label: str, caption: Any) -> None:
        """Draw one still at full column width, with its caption underneath."""
        width = self.right - self.left
        with self.d["Image"].open(path) as image:
            draw_width = width
            draw_height = width * image.height / image.width
        # A very tall still would eat a whole page; cap it and centre what is left.
        max_height = 300
        if draw_height > max_height:
            draw_width = draw_width * max_height / draw_height
            draw_height = max_height
        caption_lines = self.wrap(f"{number_label} {clean_text(caption)}".strip(), "MalgunGothic", 8.5, width)
        caption_height = 14 + len(caption_lines) * 12
        remaining = self.y - self.bottom - 4 - caption_height
        if draw_height > remaining >= 170:
            draw_width = draw_width * remaining / draw_height
            draw_height = remaining
        self.ensure(draw_height + caption_height)
        self.canvas.drawImage(str(path), self.left + (width - draw_width) / 2, self.y - draw_height,
                              width=draw_width, height=draw_height, preserveAspectRatio=True,
                              anchor="c", mask="auto")
        self.y -= draw_height + 12
        for line in caption_lines:
            self.canvas.setFillColor(self.colors["muted"])
            self.canvas.setFont("MalgunGothic", 8.5)
            self.canvas.drawString(self.left, self.y - 8.5, line)
            self.y -= 12
        self.y -= 14

    def figure_grid(self, items: list[tuple[Any, str, str]], columns: int = 2,
                    image_height: float = 155) -> None:
        """Draw compact evidence figures without changing their aspect ratio or cropping them."""
        if not items:
            return
        columns = max(1, min(columns, 3))
        gap = 14
        cell_width = (self.right - self.left - gap * (columns - 1)) / columns
        for row_start in range(0, len(items), columns):
            row = items[row_start:row_start + columns]
            prepared: list[tuple[Any, str, list[str], float, float]] = []
            max_caption_lines = 1
            for path, number_label, caption in row:
                with self.d["Image"].open(path) as image:
                    scale = min(cell_width / image.width, image_height / image.height)
                    draw_width = image.width * scale
                    draw_height = image.height * scale
                lines = self.wrap(f"{number_label} {clean_text(caption)}".strip(),
                                  "MalgunGothic", 7.7, cell_width)
                max_caption_lines = max(max_caption_lines, len(lines))
                prepared.append((path, number_label, lines, draw_width, draw_height))
            row_height = image_height + 12 + max_caption_lines * 10 + 18
            self.ensure(row_height)
            row_top = self.y
            for index, (path, _number_label, lines, draw_width, draw_height) in enumerate(prepared):
                x = self.left + index * (cell_width + gap)
                image_y = row_top - (image_height + draw_height) / 2
                self.canvas.drawImage(str(path), x + (cell_width - draw_width) / 2, image_y,
                                      width=draw_width, height=draw_height, preserveAspectRatio=True,
                                      anchor="c", mask="auto")
                caption_y = row_top - image_height - 9
                for line in lines:
                    self.canvas.setFillColor(self.colors["muted"])
                    self.canvas.setFont("MalgunGothic", 7.7)
                    self.canvas.drawString(x, caption_y, line)
                    caption_y -= 10
            self.y -= row_height

    def note_grid(self, items: list[tuple[str, str]], height: float = 86) -> None:
        if not items:
            return
        gap = 12
        cell_width = (self.right - self.left - gap) / 2
        self.ensure(height + 14)
        for index, (label, body) in enumerate(items[:2]):
            x = self.left + index * (cell_width + gap)
            self.canvas.setFillColor(self.colors["soft"])
            self.canvas.setStrokeColor(self.colors["line"])
            self.canvas.roundRect(x, self.y - height, cell_width, height, 3, fill=1, stroke=1)
            self.label(label, x + 12, self.y - 18)
            self.text(body, x + 12, self.y - 38, cell_width - 24, size=8.2, leading=12,
                      color="muted", max_lines=4)
        self.y -= height + 14

    def link_card_grid(self, items: list[tuple[str, str, str, str]], height: float = 72) -> None:
        if not items:
            return
        gap = 10
        cell_width = (self.right - self.left - gap) / 2
        for row_start in range(0, len(items), 2):
            row = items[row_start:row_start + 2]
            self.ensure(height + 10)
            for index, (kind, title, description, url) in enumerate(row):
                x = self.left + index * (cell_width + gap)
                bottom = self.y - height
                self.canvas.setFillColor(self.colors["paper"])
                self.canvas.setStrokeColor(self.colors["line"])
                self.canvas.roundRect(x, bottom, cell_width, height, 3, fill=1, stroke=1)
                self.label(kind.upper(), x + 10, self.y - 15)
                title_lines = self.wrap(title, "MalgunGothic-Bold", 8.5, cell_width - 20)[:2]
                title_y = self.y - 31
                self.canvas.setFillColor(self.colors["ink"])
                self.canvas.setFont("MalgunGothic-Bold", 8.5)
                for line in title_lines:
                    self.canvas.drawString(x + 10, title_y, line)
                    title_y -= 11
                description_lines = self.wrap(description, "MalgunGothic", 7.2, cell_width - 20)[:2]
                self.canvas.setFillColor(self.colors["muted"])
                self.canvas.setFont("MalgunGothic", 7.2)
                description_y = max(bottom + 11, title_y - 2)
                for line in description_lines:
                    self.canvas.drawString(x + 10, description_y, line)
                    description_y -= 9
                self.canvas.linkURL(url, (x, bottom, x + cell_width, self.y), relative=0)
            self.y -= height + 10

    def link_line(self, label: Any, url: str) -> None:
        self.ensure(20)
        self.link(label, url, self.left, self.y - 9, 9.5)
        self.y -= 20

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

    def diagram(self, kind: str, title: str, nodes: list[str], y: float) -> float:
        """Draw one of eight project-specific explanatory geometries."""
        c = self.canvas
        area_height = 170
        top = y
        bottom = y - area_height
        self.text(title, self.left, top - 12, self.right - self.left,
                  size=10.5, font="MalgunGothic-Bold", leading=14, max_lines=2)

        def box(cx: float, cy: float, width: float, height: float, value: str, index: int) -> None:
            x = cx - width / 2
            box_bottom = cy - height / 2
            c.setFillColor(self.colors["paper"])
            c.setStrokeColor(self.colors["line"])
            c.setLineWidth(0.8)
            c.roundRect(x, box_bottom, width, height, 3, fill=1, stroke=1)
            self.label(f"0{index + 1}", x + 9, cy + 9)
            self.text(value, x + 9, cy - 8, width - 18, size=7.4,
                      font="MalgunGothic-Bold", leading=10, max_lines=3)

        def connector(start: tuple[float, float], end: tuple[float, float], accent: str = "signal") -> None:
            c.setStrokeColor(self.colors[accent])
            c.setLineWidth(1.2)
            c.line(start[0], start[1], end[0], end[1])
            c.setFillColor(self.colors[accent])
            c.circle(end[0], end[1], 2.2, fill=1, stroke=0)

        center_x = (self.left + self.right) / 2
        center_y = bottom + 80
        if kind == "coordinate-chain":
            width = 104
            centers = [(self.left + 58 + index * 122, center_y) for index in range(4)]
            for index in range(3):
                connector((centers[index][0] + width / 2, center_y), (centers[index + 1][0] - width / 2, center_y))
            for index, center in enumerate(centers):
                box(*center, width, 58, nodes[index], index)
        elif kind == "optimization-loop":
            centers = [(self.left + 110, center_y + 34), (self.right - 110, center_y + 34),
                       (self.right - 110, center_y - 34), (self.left + 110, center_y - 34)]
            for index in range(4):
                connector(centers[index], centers[(index + 1) % 4], "warm" if index == 3 else "signal")
            for index, center in enumerate(centers):
                box(*center, 142, 48, nodes[index], index)
        elif kind == "sync-topology":
            # Three tiers of 46pt boxes with 6pt gaps fill the panel exactly: node 04 used to
            # cross the frame edge into the caption, and lifting it alone made it collide with
            # the hub instead. The hub stays widest so it still reads as the shared centre.
            centers = [(center_x, center_y + 11), (self.left + 92, center_y + 63),
                       (self.right - 92, center_y + 63), (center_x, center_y - 41)]
            for index in range(1, 4):
                connector(centers[index], centers[0])
            box(*centers[0], 146, 46, nodes[0], 0)
            for index in range(1, 4):
                box(*centers[index], 126, 46, nodes[index], index)
        elif kind == "navigation-loop":
            centers = [(center_x - 150, center_y + 41), (center_x, center_y + 41),
                       (center_x + 150, center_y + 41), (center_x, center_y - 42)]
            for start, end in [(0, 1), (1, 2), (2, 3), (3, 0)]:
                connector(centers[start], centers[end], "warm" if start == 3 else "signal")
            for index, center in enumerate(centers):
                box(*center, 124, 48, nodes[index], index)
        elif kind == "sensor-convergence":
            centers = [(self.left + 98, center_y + 54), (self.left + 98, center_y + 6),
                       (self.left + 98, center_y - 42), (self.right - 118, center_y + 6)]
            for index in range(3):
                connector((centers[index][0] + 66, centers[index][1]), (centers[3][0] - 76, centers[3][1]))
            for index in range(3):
                box(*centers[index], 132, 42, nodes[index], index)
            box(*centers[3], 152, 62, nodes[3], 3)
        elif kind == "product-loop":
            centers = [(center_x, center_y + 54), (center_x + 155, center_y + 6),
                       (center_x, center_y - 42), (center_x - 155, center_y + 6)]
            for index in range(4):
                connector(centers[index], centers[(index + 1) % 4], "warm" if index == 3 else "signal")
            for index, center in enumerate(centers):
                box(*center, 132, 46, nodes[index], index)
        elif kind == "surface-gating-chain":
            # One sensor stack feeds a far-field and a near-field track that converge on the
            # same output, so this geometry forks and rejoins rather than running as a line.
            left_center = (self.left + 78, center_y)
            track_centers = [(center_x, center_y + 36), (center_x, center_y - 36)]
            right_center = (self.right - 88, center_y)
            for track in track_centers:
                connector((left_center[0] + 60, center_y), (track[0] - 74, track[1]))
                connector((track[0] + 74, track[1]), (right_center[0] - 62, center_y), "warm")
            box(*left_center, 120, 50, nodes[0], 0)
            box(*track_centers[0], 148, 44, nodes[1], 1)
            box(*track_centers[1], 148, 44, nodes[2], 2)
            box(*right_center, 124, 50, nodes[3], 3)
        elif kind == "tracking-sdk-stack":
            centers = [(self.left + 62 + index * ((self.right - self.left - 124) / 3), center_y) for index in range(4)]
            for index in range(3):
                connector((centers[index][0] + 58, center_y), (centers[index + 1][0] - 58, center_y))
            for index, center in enumerate(centers):
                box(*center, 116, 58, nodes[index], index)
        else:
            raise ValueError(f"Unknown PDF diagram kind: {kind}.")
        return bottom

    def system_flow_diagram(self, diagram: dict[str, Any], locale: str, y: float) -> float:
        """Draw the canonical six-node story flow as a readable full-width stack."""
        c = self.canvas
        copy = localized(diagram, locale)
        nodes = diagram["nodes"]
        edges = diagram["edges"]
        self.text(copy["title"], self.left, y - 10, self.right - self.left,
                  size=10.5, font="MalgunGothic-Bold", leading=14, max_lines=1)
        self.text(copy["caption"], self.left, y - 25, self.right - self.left,
                  size=8, leading=11, color="muted", max_lines=1)

        node_top = y - 40
        node_height = 32
        for index, node in enumerate(nodes):
            node_copy = localized(node, locale)
            node_bottom = node_top - node_height
            c.setFillColor(self.colors["paper"])
            c.setStrokeColor(self.colors["line"])
            c.setLineWidth(0.8)
            c.roundRect(self.left, node_bottom, self.right - self.left, node_height, 3, fill=1, stroke=1)
            self.label(f"0{index + 1}", self.left + 10, node_top - 13)
            self.text(node_copy["label"], self.left + 38, node_top - 12, 150,
                      size=8.5, font="MalgunGothic-Bold", leading=10, max_lines=1)
            self.text(node_copy["detail"], self.left + 194, node_top - 12, self.right - self.left - 204,
                      size=7.8, leading=10, color="muted", max_lines=1)
            if index < len(edges):
                edge = edges[index]
                edge_copy = localized(edge, locale)
                edge_y = node_bottom - 12
                c.setFillColor(self.colors["signal"])
                c.setFont("FlowSymbol", 9)
                c.drawString(self.left + 14, edge_y, "⇄" if edge["direction"] == "bidirectional" else "→")
                self.text(edge_copy["label"], self.left + 38, edge_y, self.right - self.left - 48,
                          size=7.8, leading=9, color="muted", max_lines=1)
                node_top = node_bottom - 17
            else:
                node_top = node_bottom

        boundary_y = node_top - 16
        self.text(copy["boundaryLabel"], self.left, boundary_y, self.right - self.left,
                  size=8.5, font="MalgunGothic-Bold", leading=11, color="warm", max_lines=1)
        return boundary_y - 18


def register_fonts(dependencies: dict[str, Any], regular: Path, bold: Path,
                   symbol: Path = Path(r"C:\Windows\Fonts\NotoSansKR-VF.ttf")) -> None:
    require(regular.is_file(), f"Missing Korean font: {regular}")
    require(bold.is_file(), f"Missing Korean bold font: {bold}")
    require(symbol.is_file(), f"Missing flow symbol font: {symbol}")
    dependencies["pdfmetrics"].registerFont(dependencies["TTFont"]("MalgunGothic", str(regular)))
    dependencies["pdfmetrics"].registerFont(dependencies["TTFont"]("MalgunGothic-Bold", str(bold)))
    dependencies["pdfmetrics"].registerFont(dependencies["TTFont"]("FlowSymbol", str(symbol)))


def localized(record: dict[str, Any], locale: str) -> dict[str, Any]:
    translations = record.get("translations")
    require(isinstance(translations, dict) and isinstance(translations.get(locale), dict),
            f"Missing {locale} translation.")
    return translations[locale]


def canonical_project_media(project: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Index every canonical project media surface, including nested story posters."""
    indexed: dict[str, dict[str, Any]] = {}

    def add(item: Any) -> None:
        if not isinstance(item, dict) or not isinstance(item.get("id"), str):
            return
        indexed.setdefault(item["id"], item)

    media = project.get("media")
    if isinstance(media, dict):
        for slot in ["lead", "video", "poster"]:
            add(media.get(slot))
        for slot in ["references", "gallery"]:
            items = media.get(slot)
            for item in items if isinstance(items, list) else []:
                add(item)
    sections = project.get("storySections")
    for section in sections if isinstance(sections, list) else []:
        items = section.get("media") if isinstance(section, dict) else None
        for item in items if isinstance(items, list) else []:
            add(item)
            if isinstance(item, dict):
                add(item.get("poster"))
    return indexed


def selected_media_image(project: dict[str, Any], item: Any) -> dict[str, Any] | None:
    """Resolve an approved image or the canonical poster for an approved video."""
    if not isinstance(item, dict) or item.get("status") != "approved":
        return None
    if item.get("type") == "image":
        return item
    if item.get("type") != "video":
        return None
    media = project.get("media")
    lead = media.get("lead") if isinstance(media, dict) else None
    poster = (media.get("poster") if isinstance(media, dict) else None) if (
        isinstance(lead, dict) and lead.get("id") == item.get("id")
    ) else item.get("poster")
    if isinstance(poster, dict) and poster.get("type") == "image" and poster.get("status") == "approved":
        return poster
    return None


def resolve_sequence_sections(project: dict[str, Any], locale: str) -> list[tuple[dict[str, Any], dict[str, Any]]]:
    source = project.get("storySections") if project.get("storySections") else project["blocks"]
    by_key = {section["key"]: section for section in source}
    return [(by_key[key], localized(by_key[key], locale)) for key in project["pdfSequence"]["middle"]]


def resolve_sequence_diagram(project: dict[str, Any]) -> dict[str, Any]:
    contract = project["pdfSequence"]["diagram"]
    story_key = contract.get("storySectionKey") if isinstance(contract, dict) else None
    if isinstance(story_key, str):
        for section in project.get("storySections", []):
            if section.get("key") == story_key:
                return section["diagram"]
        raise ValueError(f"{project.get('slug', 'project')}: unresolved story diagram {story_key}.")
    return contract


def block_body(block: dict[str, Any], copy: dict[str, Any]) -> str:
    if block["type"] == "list":
        return " · ".join(clean_text(item) for item in copy["items"])
    return clean_text(copy["body"])


def preflight_local_evidence(payload: dict[str, Any], publish_root: Path,
                             dependencies: dict[str, Any]) -> dict[str, Path]:
    """Resolve and decode approved local evidence before any output stage is created."""
    resolved: dict[str, Path] = {}
    root = publish_root.resolve()
    for entry in payload["evidence"]:
        source = clean_text(entry["source"])
        if entry["state"] != "approved-public" or entry["type"] not in {"image", "video"}:
            continue
        project_root = (root / "assets" / "projects" / entry["project"]).resolve()
        candidate = root.joinpath(*source.split("/"))
        cursor = root
        for segment in source.split("/"):
            cursor = cursor / segment
            require(cursor.exists(), f"{entry['id']}: approved local evidence is missing.")
            require(not cursor.is_symlink() and not cursor.is_junction(),
                    f"{entry['id']}: approved local evidence must not use symbolic links or junctions.")
        try:
            real_path = candidate.resolve(strict=True)
            real_path.relative_to(project_root)
        except (OSError, ValueError) as error:
            raise ValueError(f"{entry['id']}: approved local evidence is missing or escapes its project directory.") from error
        require(real_path.is_file(), f"{entry['id']}: approved local evidence must be a regular file.")
        if entry["type"] == "image":
            try:
                with dependencies["Image"].open(real_path) as image:
                    require(image.format == "PNG" and image.width > 0 and image.height > 0,
                            f"{entry['id']}: approved image must be a decodable PNG.")
                    image.verify()
            except (OSError, ValueError) as error:
                raise ValueError(f"{entry['id']}: approved image must be a decodable PNG.") from error
        resolved[entry["id"]] = real_path
    return resolved


def selected_pdf_evidence_image(project: dict[str, Any], local_evidence: dict[str, Path]) -> Path | None:
    """Use an approved image lead directly, or the approved poster paired with a video lead."""
    media = project.get("media")
    if not isinstance(media, dict):
        return None
    lead = media.get("lead")
    if not isinstance(lead, dict) or lead.get("id") != project["pdfSequence"]["evidenceId"]:
        return None
    selected = selected_media_image(project, lead)
    return local_evidence.get(selected.get("id")) if selected else None


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
            "figure": "그림",
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
        "figure": "Figure",
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


def project_figures(project: dict[str, Any], local_evidence: dict[str, Path],
                    locale: str) -> list[tuple[Path, str]]:
    """Every approved local still for this project, in reading order, with its caption."""
    media = project.get("media")
    if not isinstance(media, dict):
        return []
    copy = localized(project, locale)
    figure_ids = project.get("pdfSequence", {}).get("figureIds")
    if isinstance(figure_ids, list):
        indexed = canonical_project_media(project)
        selected_figures: list[tuple[Path, str]] = []
        selected_ids: set[str] = set()

        def add_selected(item: Any, caption: str) -> None:
            image = selected_media_image(project, item)
            require(isinstance(image, dict),
                    f"{project['slug']}: PDF figure requires an approved image or poster.")
            identifier = require_text(image.get("id"), f"{project['slug']} selected PDF figure id")
            path = local_evidence.get(identifier)
            require(path is not None, f"{project['slug']}: selected PDF figure {identifier} is not available.")
            if identifier not in selected_ids:
                selected_ids.add(identifier)
                selected_figures.append((path, caption))

        add_selected(media.get("lead"), clean_text(copy.get("mediaCaption")))
        for identifier in figure_ids:
            item = indexed.get(identifier)
            require(isinstance(item, dict), f"{project['slug']}: unresolved PDF figure {identifier}.")
            add_selected(item, clean_text(localized(item, locale).get("caption")))
        return selected_figures

    figures: list[tuple[Path, str]] = []
    seen: set[str] = set()

    def add(item: Any, caption: str) -> None:
        if not isinstance(item, dict) or item.get("type") != "image" or item.get("status") != "approved":
            return
        identifier = item.get("id")
        path = local_evidence.get(identifier)
        if path is None or identifier in seen:
            return
        seen.add(identifier)
        figures.append((path, caption))

    lead = media.get("lead")
    lead_caption = clean_text(copy.get("mediaCaption"))
    if isinstance(lead, dict) and lead.get("type") == "image":
        add(lead, lead_caption)
    else:
        add(media.get("poster"), lead_caption)
    gallery = media.get("gallery")
    for item in gallery if isinstance(gallery, list) else []:
        caption = ""
        translations = item.get("translations") if isinstance(item, dict) else None
        if isinstance(translations, dict) and isinstance(translations.get(locale), dict):
            caption = clean_text(translations[locale].get("caption"))
        add(item, caption)
    return figures


def public_project_links(payload: dict[str, Any], project: dict[str, Any],
                         locale: str) -> list[tuple[str, str]]:
    links: list[tuple[str, str]] = []
    seen: set[str] = set()
    for link in project.get("links", []):
        link_copy = localized(link, locale)
        url = clean_text(link.get("href"))
        if url and url not in seen:
            links.append((clean_text(link_copy.get("label")), url))
            seen.add(url)
    for entry in payload["evidence"]:
        source = clean_text(entry.get("source"))
        if (entry.get("project") == project["slug"] and entry.get("state") == "approved-public"
                and source.startswith("https://") and source not in seen):
            links.append((source.replace("https://", ""), source))
            seen.add(source)
    return links


def evidence_first_pdf_labels(locale: str) -> dict[str, str]:
    if locale == "ko":
        return {
            "overview": "개요",
            "tool_evidence": "도구 증거",
            "architecture_api": "아키텍처와 API",
            "medical": "의료 적용",
            "industrial": "산업 확장 · 공개 문서 · 한계",
            "problem": "문제와 적용 경계",
            "role": "내 역할과 API 안정성",
            "owned": "내 역할",
            "team": "팀·협력자 경계",
            "resources": "공개 문서와 제품 정보",
            "limits": "한계와 팀 결과",
        }
    return {
        "overview": "Overview",
        "tool_evidence": "Tool evidence",
        "architecture_api": "Architecture and API",
        "medical": "Medical application",
        "industrial": "Industrial extension · public resources · limits",
        "problem": "Problem and application boundary",
        "role": "My role and API stability",
        "owned": "My role",
        "team": "Team and partner boundary",
        "resources": "Public documentation and product information",
        "limits": "Limits and team result",
    }


def generate_evidence_first_project_pdf(dependencies: dict[str, Any], payload: dict[str, Any],
                                        project: dict[str, Any], locale: str, output: Path,
                                        local_evidence: dict[str, Path]) -> int:
    """Render the SKADI evidence-first contract as exactly five authored pages."""
    copy = localized(project, locale)
    labels = evidence_first_pdf_labels(locale)
    common = project_labels(locale)
    doc = TechnicalDocument(dependencies, output, copy["title"], copy["thesis"], locale, 5)
    gallery = project["media"]["gallery"]
    gallery_by_id = {item["id"]: item for item in gallery}
    figure_numbers = {item["id"]: index + 2 for index, item in enumerate(gallery)}

    def begin_fixed_page(number: int, title: str) -> None:
        if number > 1:
            require(doc.page_no == number - 1,
                    f"{output.name}: evidence-first page {number - 1} overflowed its fixed layout.")
            doc.finish_page()
        doc.page_no = number
        doc.section_name = title
        doc.begin_page(number, title)
        doc.y = doc.top - 30

    def gallery_figure(identifier: str) -> tuple[Path, str, str]:
        item = gallery_by_id[identifier]
        path = local_evidence.get(identifier)
        require(path is not None, f"{output.name}: missing evidence image {identifier}.")
        caption = clean_text(localized(item, locale).get("caption"))
        return path, f"{common['figure']} {figure_numbers[identifier]}.", caption

    blocks = {block["key"]: (block, localized(block, locale)) for block in project["blocks"]}
    diagram = project["pdfSequence"]["diagram"]
    diagram_copy = diagram["translations"][locale]

    # 1 / 5: overview and poster (the video itself is never embedded as an image).
    begin_fixed_page(1, labels["overview"])
    doc.kicker(copy["eyebrow"])
    doc.para(copy["title"], size=23, leading=29, font="MalgunGothic-Bold", gap=12)
    doc.para(copy["thesis"], size=12.5, leading=19, font="MalgunGothic-Bold", gap=10)
    doc.meta_line([
        (common["period"], project["period"]),
        (common["state"], copy["status"]),
        (common["tier"], tier_label(payload, project["tier"], locale)),
    ])
    doc.rule(before=8, after=10)
    doc.para(copy["summary"], color="muted", gap=10)
    poster = selected_pdf_evidence_image(project, local_evidence)
    require(poster is not None, f"{output.name}: evidence-first overview requires the approved poster.")
    doc.figure(poster, f"{common['figure']} 1.", copy["mediaCaption"])
    doc.h2(labels["problem"])
    doc.para(copy["problem"], size=9.2, leading=13, color="muted", gap=4)

    # 2 / 5: the three platform tools, before interpretation.
    begin_fixed_page(2, labels["tool_evidence"])
    marker_block, marker_copy = blocks["marker-definition"]
    doc.h3(marker_copy["heading"])
    doc.para(block_body(marker_block, marker_copy), size=9, leading=13, color="muted", gap=8)
    tool_ids = ["skadi-marker-workflow-01", "skadi-api-openex-01", "skadi-viewer-6dof-01"]
    doc.figure_grid([gallery_figure(identifier) for identifier in tool_ids[:2]], columns=2, image_height=140)
    doc.figure_grid([gallery_figure(tool_ids[2])], columns=1, image_height=190)
    doc.para(copy["evidence"], size=8.7, leading=12.5, color="muted", gap=4)

    # 3 / 5: Define -> Open -> Track -> Apply, owned API stability, and the public change note.
    begin_fixed_page(3, labels["architecture_api"])
    doc.y = doc.diagram(diagram["kind"], diagram_copy["title"],
                        [clean_text(node) for node in diagram_copy["nodes"]], doc.y) - 8
    step_notes = [(step["label"], clean_text(localized(step, locale)["description"]))
                  for step in project["architectureSteps"]]
    doc.note_grid(step_notes[:2], height=70)
    doc.note_grid(step_notes[2:], height=70)
    doc.h2(labels["role"])
    doc.para(copy["role"], size=9, leading=13, color="muted", gap=8)
    for key in ["api-stability", "viewer-delivery"]:
        block, block_copy = blocks[key]
        doc.h3(block_copy["heading"])
        doc.para(block_body(block, block_copy), size=8.7, leading=12.5, color="muted", gap=6)
    for link in project.get("links", []):
        doc.link_line(clean_text(localized(link, locale).get("label")), clean_text(link["href"]))

    # 4 / 5: medical primary track, with the two application artifacts not already shown as tools.
    begin_fixed_page(4, labels["medical"])
    medical = project["applicationTracks"][0]
    medical_copy = localized(medical, locale)
    doc.h2(medical_copy["title"])
    doc.para(medical_copy["summary"], size=9.5, leading=14, color="muted", gap=8)
    medical_ids = [identifier for identifier in medical["evidenceIds"]
                   if identifier in {"skadi-dental-registration-01", "skadi-slicer-template-01"}]
    doc.figure_grid([gallery_figure(identifier) for identifier in medical_ids], columns=2, image_height=190)
    doc.note_grid([
        (labels["owned"], medical_copy["ownedRole"]),
        (labels["team"], medical_copy["teamBoundary"]),
    ], height=94)

    # 5 / 5: industrial extension, four descriptive public resources, and explicit limits.
    begin_fixed_page(5, labels["industrial"])
    industrial = project["applicationTracks"][1]
    industrial_copy = localized(industrial, locale)
    doc.h3(industrial_copy["title"])
    doc.para(industrial_copy["summary"], size=8.7, leading=12.5, color="muted", gap=5)
    doc.figure_grid([gallery_figure("skadi-robot-docking-01")], columns=1, image_height=100)
    doc.note_grid([
        (labels["owned"], industrial_copy["ownedRole"]),
        (labels["team"], industrial_copy["teamBoundary"]),
    ], height=70)
    doc.h3(labels["resources"])
    resource_cards = []
    for resource in project["publicResources"]:
        resource_copy = localized(resource, locale)
        resource_cards.append((resource["type"], resource_copy["title"],
                               resource_copy["description"], resource["href"]))
    doc.link_card_grid(resource_cards, height=62)
    doc.h3(labels["limits"])
    doc.para(copy["limitation"], size=8, leading=11, color="muted", gap=4)
    doc.para(copy["teamResult"], size=8, leading=11, color="muted", gap=4)
    boundary_block, boundary_copy = blocks["integration-boundary"]
    doc.h3(boundary_copy["heading"])
    doc.para(block_body(boundary_block, boundary_copy), size=8, leading=11, color="muted", gap=2)

    require(doc.page_no == 5, f"{output.name}: evidence-first page 5 overflowed its fixed layout.")
    doc.finish_page()
    doc.save()
    return 5


def generate_project_pdf(dependencies: dict[str, Any], payload: dict[str, Any], project: dict[str, Any],
                         locale: str, output: Path, local_evidence: dict[str, Path]) -> int:
    """Compose one case as a flowing document and return how many pages it needed."""
    if project.get("caseLayout") == "evidence-first":
        return generate_evidence_first_project_pdf(
            dependencies, payload, project, locale, output, local_evidence
        )
    copy = localized(project, locale)
    labels = project_labels(locale)
    has_story = bool(project.get("storySections"))
    diagram = resolve_sequence_diagram(project)
    diagram_copy = localized(diagram, locale)
    figures = project_figures(project, local_evidence, locale)
    blocks = [(block, localized(block, locale)) for block in project.get("blocks", [])]
    approach = (resolve_sequence_sections(project, locale) if has_story
                else [pair for pair in blocks if pair[0]["type"] in {"system", "text", "list"}])
    evidence_blocks = [pair for pair in blocks if pair[0]["type"] == "evidence"]
    limit_blocks = [pair for pair in blocks if pair[0]["type"] == "limitation"]
    capabilities = [capability_label(payload, key, locale) for key in project.get("capabilityKeys", [])]
    links = public_project_links(payload, project, locale)

    def compose(total_pages: int) -> int:
        doc = TechnicalDocument(dependencies, output, copy["title"], copy["thesis"], locale, total_pages)
        doc.start(labels["case"])
        counter = {"figure": 0}

        def draw(items: list[tuple[Path, str]]) -> None:
            if has_story and len(items) > 1:
                compact = []
                for path, caption in items[:2]:
                    counter["figure"] += 1
                    compact.append((path, f"{labels['figure']} {counter['figure']}.", caption))
                doc.figure_grid(compact, columns=2, image_height=155)
                items = items[2:]
            for path, caption in items:
                counter["figure"] += 1
                doc.figure(path, f"{labels['figure']} {counter['figure']}.", caption)

        doc.kicker(copy["eyebrow"])
        doc.para(copy["title"], size=24, leading=31, font="MalgunGothic-Bold", gap=14)
        doc.para(copy["thesis"], size=13, leading=20, font="MalgunGothic-Bold", gap=14)
        doc.meta_line([
            (labels["period"], project["period"]),
            (labels["state"], copy["status"]),
            (labels["tier"], tier_label(payload, project["tier"], locale)),
        ])
        doc.rule()
        doc.para(copy["summary"], color="muted", gap=16)
        draw(figures[:1])

        doc.h2(labels["problem"])
        doc.para(copy["problem"], size=11.5, leading=18, font="MalgunGothic-Bold", gap=10)

        doc.h2(labels["decision"])
        doc.h3(labels["role"])
        if copy.get("roleLabel"):
            doc.para(copy["roleLabel"], font="MalgunGothic-Bold", gap=4)
        doc.para(copy["role"], color="muted")
        for block, block_copy in approach:
            doc.h3(block_copy["heading"])
            if has_story:
                if block_copy.get("body"):
                    doc.para(block_copy["body"], color="muted", gap=6)
                if block_copy.get("items"):
                    doc.bullets(block_copy["items"])
            elif block["type"] == "list":
                doc.bullets(block_copy["items"])
            else:
                doc.para(block_copy["body"], color="muted")
        if diagram["kind"] == "system-flow":
            doc.ensure(360)
            doc.y = doc.system_flow_diagram(diagram, locale, doc.y) - 12
        else:
            doc.ensure(210)
            doc.y = doc.diagram(diagram["kind"], diagram_copy["title"],
                                [clean_text(node) for node in diagram_copy["nodes"]], doc.y) - 12
        doc.para(labels["flow_note"], size=8.5, leading=12, color="muted", gap=14)

        doc.h2(labels["evidence"])
        doc.para(copy["evidence"], color="muted")
        for block, block_copy in evidence_blocks:
            doc.h3(block_copy["heading"])
            doc.para(block_copy["body"], color="muted")
        draw(figures[1:])

        doc.h2(labels["attribution"])
        doc.h3(labels["team"])
        doc.para(copy["teamResult"], color="muted")
        doc.h3(labels["limit"])
        doc.para(copy["limitation"], color="muted")
        for block, block_copy in limit_blocks:
            doc.h3(block_copy["heading"])
            doc.para(block_copy["body"], color="muted")
        doc.h3(labels["collaboration"])
        doc.para(copy["collaboration"], color="muted")

        doc.h2(labels["tech"])
        doc.para(" · ".join(clean_text(item) for item in project.get("tech", [])), color="muted", gap=8)
        if capabilities:
            doc.h3(labels["capability"])
            doc.para(" · ".join(capabilities), color="muted")

        # Links and contact share one heading: split across two, they routinely opened a
        # final page that carried nothing else.
        doc.h2(labels["registered"])
        if links:
            for label, url in links:
                doc.link_line(label, url)
        else:
            doc.para(labels["no_public"], color="muted")
        doc.h3(labels["contact"])
        doc.para(labels["contact_body"], color="muted", gap=10)
        doc.link_line(CONTACT_EMAIL, f"mailto:{CONTACT_EMAIL}")
        doc.link_line("rafaam11.github.io", "https://rafaam11.github.io")

        pages = doc.page_no
        doc.finish_page()
        doc.save()
        return pages

    pages = compose(1)
    if pages != 1:
        settled = compose(pages)
        require(settled == pages, f"{output.name}: page count did not settle ({pages} then {settled}).")
    return pages


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


def validate_review_render(dependencies: dict[str, Any], review_dir: Path,
                           expected_pages: dict[str, int], manifest: dict[str, Any]) -> None:
    """expected_pages maps each document to the page count its own layout produced."""
    require(set(manifest) == {"renderer", "dpi", "pageCount", "documents"},
            "Review manifest has an invalid schema.")
    require(manifest["renderer"] == "PyMuPDF fallback" and manifest["dpi"] == 120,
            "Review manifest has an invalid renderer contract.")
    require(manifest["pageCount"] == sum(expected_pages.values()),
            "Review render page total does not match the generated documents.")
    require(isinstance(manifest["documents"], list) and len(manifest["documents"]) == 16,
            "Review manifest must track exactly sixteen documents.")
    seen: set[str] = set()
    for document in manifest["documents"]:
        require(isinstance(document, dict) and set(document) == {"pdf", "pages", "contactSheet"},
                "Review document has an invalid schema.")
        name = document["pdf"]
        require(name in expected_pages and name not in seen, f"Unexpected or duplicate review document: {name}.")
        require(document["pages"] == expected_pages[name], f"{name}: invalid review page count.")
        require(document["contactSheet"] == f"{Path(name).stem}.png", f"{name}: invalid contact-sheet name.")
        seen.add(name)
    require(seen == set(expected_pages), "Review manifest is missing a canonical document.")

    page_files = {item.name for item in (review_dir / "pages").iterdir() if item.is_file()}
    expected_page_files = {
        f"{Path(name).stem}-page-{page:02d}.png"
        for name, count in expected_pages.items() for page in range(1, count + 1)
    }
    sheet_files = {item.name for item in (review_dir / "contact-sheets").iterdir() if item.is_file()}
    expected_sheet_files = {f"{Path(name).stem}.png" for name in expected_pages}
    require(page_files == expected_page_files, "Review pages contain an unexpected or missing render.")
    require(sheet_files == expected_sheet_files, "Review contact sheets contain an unexpected or missing render.")
    require(json.loads((review_dir / "review-manifest.json").read_text(encoding="utf-8")) == manifest,
            "Review manifest did not round-trip.")
    for relative_directory, names in [("pages", page_files), ("contact-sheets", sheet_files)]:
        for name in names:
            with dependencies["Image"].open(review_dir / relative_directory / name) as image:
                require(image.format == "PNG" and image.width > 0 and image.height > 0,
                        f"{name}: invalid review image.")
                image.verify()


def artifact_record(file_path: Path, relative_path: str, kind: str, **fields: Any) -> dict[str, Any]:
    return {
        "path": relative_path,
        "kind": kind,
        **fields,
        "bytes": file_path.stat().st_size,
        "sha256": sha256(file_path),
    }


def validate_staged_publication(dependencies: dict[str, Any], output_dir: Path,
                                project_assets: Path, manifest: dict[str, Any]) -> None:
    expected_project_names = {f"{slug}-{locale}.pdf" for slug in EXPECTED_SLUGS for locale in LOCALES}
    require({item.name for item in output_dir.iterdir()} == expected_project_names | {"manifest.json"},
            "Staged output/pdf contains an unexpected or missing artifact.")
    require({item.name for item in project_assets.iterdir()} == expected_project_names,
            "Staged assets/pdfs contains an unexpected or missing artifact.")
    manifest_path = output_dir / "manifest.json"
    require(json.loads(manifest_path.read_text(encoding="utf-8")) == manifest,
            "Staged PDF manifest did not round-trip.")
    roots = {
        "output/pdf/": output_dir,
        "assets/pdfs/": project_assets,
    }
    expected_artifacts = 2 * len(EXPECTED_SLUGS) * len(LOCALES)
    require(len(manifest["artifacts"]) == expected_artifacts,
            f"Staged PDF manifest must track exactly {expected_artifacts} artifacts.")
    for artifact in manifest["artifacts"]:
        prefix = next((value for value in roots if artifact["path"].startswith(value)), None)
        require(prefix is not None, f"Manifest artifact has an invalid path: {artifact['path']}.")
        file_path = roots[prefix] / artifact["path"][len(prefix):]
        require(file_path.is_file(), f"Manifest artifact is missing: {artifact['path']}.")
        require(file_path.stat().st_size == artifact["bytes"] and sha256(file_path) == artifact["sha256"],
                f"Manifest artifact checksum mismatch: {artifact['path']}.")
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
    local_evidence = preflight_local_evidence(payload, publish_root, dependencies)
    # assets/cv holds the author's own CV PDFs; they are tracked source, never generated here.
    project_assets = publish_root / "assets" / "pdfs"
    targets = [output_dir, project_assets]
    token = uuid.uuid4().hex
    stages: list[Path] = []
    review_stage: Path | None = None
    expected_names = [f"{slug}-{locale}.pdf" for slug in EXPECTED_SLUGS for locale in LOCALES]
    documents: list[dict[str, Any]] = []
    artifacts: list[dict[str, Any]] = []
    try:
        for target in targets:
            target.parent.mkdir(parents=True, exist_ok=True)
            stage = target.parent / f".{target.name}.stage-{token}"
            stage.mkdir()
            stages.append(stage)
        staged_output, staged_projects = stages
        if review_dir:
            review_dir.parent.mkdir(parents=True, exist_ok=True)
            review_stage = review_dir.parent / f".{review_dir.name}.stage-{token}"
            review_stage.mkdir()
            stages.append(review_stage)

        for project in payload["projects"]:
            for locale in LOCALES:
                name = f"{project['slug']}-{locale}.pdf"
                output = staged_output / name
                pages = generate_project_pdf(dependencies, payload, project, locale, output, local_evidence)
                require(2 <= pages <= 12, f"{name}: unexpected page count {pages}.")
                qa = validate_pdf(dependencies, output, pages, localized(project, locale)["title"])
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

        artifacts.sort(key=lambda artifact: artifact["path"])
        manifest = {
            "schemaVersion": 3,
            "sourceDigest": payload["sourceDigest"],
            "generator": GENERATOR_PUBLIC_PATH,
            "generatorVersion": GENERATOR_VERSION,
            "generatorSha256": normalized_text_source_sha256(Path(__file__).resolve()),
            "documents": documents,
            "artifacts": artifacts,
        }
        (staged_output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        validate_staged_publication(dependencies, staged_output, staged_projects, manifest)
        result = dict(manifest)
        publications = list(zip(targets, stages[:len(targets)]))
        if review_dir and review_stage:
            staged_pdf_paths = [staged_output / name for name in expected_names]
            review_manifest = render_reviews(dependencies, staged_pdf_paths, review_stage)
            validate_review_render(dependencies, review_stage,
                                   {document["name"]: document["pages"] for document in documents},
                                   review_manifest)
            result["review"] = review_manifest
            publications.append((review_dir, review_stage))
        atomic_swap_directories(publications)
        return result
    finally:
        for stage in stages:
            if stage.exists():
                shutil.rmtree(stage)


def main(argv: list[str]) -> int:
    options = parse_arguments(argv)
    payload = load_export(options.input.resolve())
    if options.validate_only:
        print(f"PDF input validation passed: {len(payload['projects'])} projects, 2 locales, public CV {payload['cv']['version']}.")
        return 0
    dependencies = import_pdf_dependencies()
    register_fonts(
        dependencies,
        options.font_regular.resolve(),
        options.font_bold.resolve(),
        options.font_symbol.resolve(),
    )
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
