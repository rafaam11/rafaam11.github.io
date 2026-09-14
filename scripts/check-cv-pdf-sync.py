"""Compare selected structured CV facts with the author's PDFs; never rewrite PDFs.

Requires PyMuPDF, already used by the project's PDF generator. This checks explicit
terms, dates, publication titles and patent states, not arbitrary prose equivalence.
"""
import argparse
import json
import re
from pathlib import Path
import pymupdf


def normalized(value):
    return re.sub(r'[\s\-–—·.,:;()"“”]+', '', value).casefold()


def check(root):
    cv = json.loads((root / 'data/public-cv.json').read_text(encoding='utf-8'))
    errors = []
    for locale in ['ko', 'en']:
        with pymupdf.open(root / f'assets/cv/jinmin-kim-cv-{locale}.pdf') as doc:
            text = '\n'.join(page.get_text() for page in doc)
        compact = normalized(text)
        for index, entry in enumerate(cv['education'] + cv['experience']):
            period = entry['period'].replace('Present', '현재') if locale == 'ko' else entry['period']
            if normalized(period) not in compact:
                errors.append(f'{locale}: education/experience period {index + 1} differs from PDF')
        if normalized('4D CT') not in compact or re.search(r'4D\s*CBCT', json.dumps(cv)):
            errors.append(f'{locale}: expected PDF research term 4D CT')
        for index, publication in enumerate(cv['publications']):
            title = normalized(publication['translations'][locale]['title'])
            title_start = compact.find(title)
            # The bibliography places the author-year immediately before each title.
            # Looking anywhere in the document accepts another publication's year.
            preceding_years = re.findall(r'(?:19|20)\d{2}', compact[:title_start]) if title_start >= 0 else []
            if title_start < 0 or not preceding_years or preceding_years[-1] != publication['year']:
                errors.append(f'{locale}: publication {index + 1} title/year differs from PDF')
        for index, patent in enumerate(cv['patents']):
            start = text.find(patent['number'])
            prefix = text[:start] if start >= 0 else ''
            states = re.findall(r'\[(등록|출원|Granted|Filed)\]', prefix)
            expected = {'ko': {'granted': '등록', 'filed': '출원'}, 'en': {'granted': 'Granted', 'filed': 'Filed'}}[locale][patent['status']]
            if not states or states[-1] != expected or patent['filed'] not in text[start:start + 100]:
                errors.append(f'{locale}: patent {index + 1} state/filing date differs from PDF')
    return errors


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    errors = check(args.root)
    print('\n'.join(errors) if errors else 'CV PDF selected facts match: terms, periods, 7 publications and 7 patent states/dates in both languages.')
    raise SystemExit(bool(errors))
