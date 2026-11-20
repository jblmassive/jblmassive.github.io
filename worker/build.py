from base64 import b64encode
from html import unescape
import json
from mimetypes import guess_type
from pathlib import Path
import re
import sys

output = Path(sys.argv[1])
output.parent.mkdir(parents=True, exist_ok=True)
assets = {
    '/' + path.name: (guess_type(path)[0], b64encode(path.read_bytes()).decode('ascii'))
    for path in sorted(Path('dist').iterdir()) if path.is_file()
}
production = Path('dist/production.html').read_text()
catalogue = [
    {'id': key, 'name': unescape(name), 'pricePence': int(price) if price else None}
    for key, price, name in re.findall(
        r'data-item="([^"]+)" data-price="([^"]*)">\s*<div><strong>(.*?)</strong>',
        production
    )
]
assert len({item['id'] for item in catalogue}) == production.count('data-item="')
worker = Path('worker/index.mjs').read_text().split('\n', 1)[1]
output.write_text('const assets = ' + json.dumps(assets) + ';\nconst catalogue = ' + json.dumps(catalogue) + ';\n' + worker)
