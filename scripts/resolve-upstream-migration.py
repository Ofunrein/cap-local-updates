#!/usr/bin/env python3
import copy
import json
import pathlib
import re
import subprocess
import sys

MISSING = object()


def clone(value):
    return MISSING if value is MISSING else copy.deepcopy(value)


def merge_value(base, ours, theirs, path="package.json"):
    if ours == theirs or theirs == base:
        return clone(ours)
    if ours == base:
        return clone(theirs)
    if all(isinstance(value, dict) for value in (base, ours, theirs)):
        result = {}
        for key in dict.fromkeys([*base, *ours, *theirs]):
            value = merge_value(base.get(key, MISSING), ours.get(key, MISSING), theirs.get(key, MISSING), f"{path}.{key}")
            if value is not MISSING:
                result[key] = value
        return result
    raise ValueError(f"Conflicting upstream change requires review: {path}")


def normalize_bun(manifest):
    result = copy.deepcopy(manifest)
    pnpm = result.pop("pnpm", {})
    if set(pnpm) - {"overrides", "peerDependencyRules"}:
        raise ValueError("Unsupported pnpm configuration requires migration review")
    rules = pnpm.get("peerDependencyRules", {})
    if rules and rules != {"allowedVersions": {"next-auth>next": ">=16.0.0"}}:
        raise ValueError("Unsupported pnpm peer rules require migration review")
    overrides = result.setdefault("overrides", {})
    for name, version in pnpm.get("overrides", {}).items():
        if name in overrides and overrides[name] != version:
            raise ValueError(f"Conflicting dependency override: {name}")
        overrides[name] = version
    return result


def merge_manifests(base, ours, theirs):
    if not str(theirs.get("packageManager", "")).startswith("bun@"):
        raise ValueError("Automatic manifest resolution is limited to the Bun migration")
    return merge_value(*(normalize_bun(value) for value in (base, ours, theirs)))


def resolve_ci(text):
    pattern = re.compile(r"^<<<<<<<[^\n]*\n(.*?)^=======\n(.*?)^>>>>>>>[^\n]*\n?", re.M | re.S)
    def resolve(match):
        ours, theirs = match.groups()
        if (theirs.strip() or not ours.lstrip().startswith("rust-cache:")
                or "github.repository == 'CapSoftware/Cap'" not in ours):
            raise ValueError("Unrecognized CI conflict requires review")
        return ours
    result, count = pattern.subn(resolve, text)
    if count != 1 or any(marker in result for marker in ("<<<<<<<", "=======", ">>>>>>>")):
        raise ValueError("Unrecognized CI merge shape requires review")
    return result


def git(*args):
    return subprocess.check_output(["git", *args], text=True)


def sensitive_changes(diff):
    findings = set()
    for line in diff.splitlines():
        if not line.startswith("+") or line.startswith("+++"):
            continue
        if re.search(r"blacksmith-\d", line):
            findings.add("third-party Blacksmith runner integration")
        if re.search(r"permissions:\s*write-all", line):
            findings.add("write-all workflow token permission")
        match = re.search(r"\b(actions|attestations|checks|contents|deployments|discussions|id-token|issues|packages|pages|pull-requests|repository-projects|security-events|statuses):\s*write\b", line)
        if match:
            findings.add(f"{match.group(1)}: write token permission")
    return sorted(findings)


def main():
    if sys.argv[1:] == ["--check-workflow-policy"]:
        findings = sensitive_changes(git("diff", "--unified=0", "origin/main", "HEAD", "--", ".github"))
        if findings:
            raise ValueError("Owner review required before publishing: " + "; ".join(findings))
        print("No new workflow write scopes or third-party runners detected.")
        return
    conflicts = git("diff", "--name-only", "--diff-filter=U").splitlines()
    allowed = {"package.json", "pnpm-lock.yaml", ".github/workflows/ci.yml"}
    if not conflicts or set(conflicts) - allowed:
        raise ValueError("Merge includes unrecognized conflicts; resolve manually")
    if "package.json" in conflicts:
        stages = [json.loads(git("show", f":{stage}:package.json")) for stage in (1, 2, 3)]
        manifest = merge_manifests(*stages)
        pathlib.Path("package.json").write_text(json.dumps(manifest, indent="\t") + "\n")
        subprocess.run(["git", "add", "package.json"], check=True)
    manager = json.loads(pathlib.Path("package.json").read_text()).get("packageManager", "")
    if not manager.startswith("bun@"):
        raise ValueError("Expected the reviewed upstream Bun migration")
    if "pnpm-lock.yaml" in conflicts:
        if git("ls-tree", "upstream/main", "--", "pnpm-lock.yaml").strip():
            raise ValueError("Upstream retained a pnpm lockfile; manual review required")
        subprocess.run(["git", "rm", "--", "pnpm-lock.yaml"], check=True)
    if ".github/workflows/ci.yml" in conflicts:
        path = pathlib.Path(".github/workflows/ci.yml")
        path.write_text(resolve_ci(path.read_text()))
        subprocess.run(["git", "add", str(path)], check=True)
    if git("diff", "--name-only", "--diff-filter=U").strip():
        raise ValueError("Unresolved merge conflicts remain")
    print("Resolved reviewed Bun migration conflicts; fork overrides and CI gates retained.")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, subprocess.CalledProcessError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
