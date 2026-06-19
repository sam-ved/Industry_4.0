import os
import re

backend_dir = r'c:\Users\samve\Industry_4.0\backend'
modules = ['routers', 'services', 'utils', 'config', 'database', 'models']

for root, _, files in os.walk(backend_dir):
    if 'venv' in root:
        continue
    for file in files:
        if file.endswith('.py'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Replace 'from module' with 'from backend.module'
            for mod in modules:
                # Regex for from <mod>
                content = re.sub(rf'^from {mod}(\s|\.)', rf'from backend.{mod}\1', content, flags=re.MULTILINE)
                # Regex for import <mod>
                # If they do 'import database', change to 'from backend import database'
                # but only if it's on a line by itself
                content = re.sub(rf'^import {mod}$', rf'from backend import {mod}', content, flags=re.MULTILINE)

            # Remove sys.path.append lines which were hacks
            content = re.sub(r'^sys\.path\.append\(os\.path\.abspath\(os\.path\.join\(.*?\)\)\)\n?', '', content, flags=re.MULTILINE)

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
print('Done replacing imports.')
