import pkg_resources

installed = {pkg.key: pkg.version for pkg in pkg_resources.working_set}
required_pkgs = ['fastapi', 'uvicorn', 'python-dotenv', 'numpy', 'pandas', 'joblib', 'scikit-learn', 'xgboost', 'google-genai']

report = "# Dependency Report\n\n"
report += "| Package | Installed Version | Status |\n"
report += "|---------|-------------------|--------|\n"

for pkg in required_pkgs:
    pkg_key = pkg.lower()
    if pkg_key in installed:
        report += f"| {pkg} | {installed[pkg_key]} | Installed |\n"
    else:
        report += f"| {pkg} | Missing | Missing |\n"

with open('c:\\Users\\samve\\Industry_4.0\\backend\\dependency_report.md', 'w', encoding='utf-8') as f:
    f.write(report)
print('Done writing report')
