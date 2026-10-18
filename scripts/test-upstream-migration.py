import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location("migration", pathlib.Path(__file__).with_name("resolve-upstream-migration.py"))
migration = importlib.util.module_from_spec(spec)
spec.loader.exec_module(migration)


class MigrationTests(unittest.TestCase):
    def test_preserves_fork_overrides_and_independent_changes(self):
        base = {"packageManager": "pnpm@10.5.2", "scripts": {"test": "test"}, "pnpm": {"overrides": {"worklets": "1"}}}
        ours = {**base, "pnpm": {"overrides": {"worklets": "1", "keyv": "5.6.0"}}}
        theirs = {"packageManager": "bun@1.4.0", "scripts": {"test": "test", "check:bun": "node check"}, "overrides": {"worklets": "1"}}
        result = migration.merge_manifests(base, ours, theirs)
        self.assertEqual(result["packageManager"], "bun@1.4.0")
        self.assertEqual(result["overrides"], {"worklets": "1", "keyv": "5.6.0"})
        self.assertEqual(result["scripts"]["check:bun"], "node check")
        self.assertNotIn("pnpm", result)
        self.assertIn("pnpm", ours)

    def test_refuses_unrelated_semantic_conflicts(self):
        with self.assertRaisesRegex(ValueError, "scripts.test"):
            migration.merge_manifests({"scripts": {"test": "a"}}, {"scripts": {"test": "b"}}, {"packageManager": "bun@1.4.0", "scripts": {"test": "c"}})

    def test_refuses_unsupported_package_manager_rules(self):
        with self.assertRaises(ValueError):
            migration.normalize_bun({"pnpm": {"onlyBuiltDependencies": ["unknown"]}})

    def test_preserves_the_fork_guarded_cache_job(self):
        ours = "\n  rust-cache:\n    if: github.repository == 'CapSoftware/Cap'\n    steps: []\n"
        text = "jobs:\n<<<<<<< HEAD\n" + ours + "=======\n>>>>>>> upstream/main\n"
        self.assertEqual(migration.resolve_ci(text), "jobs:\n" + ours)

    def test_refuses_other_ci_conflicts(self):
        with self.assertRaises(ValueError):
            migration.resolve_ci("<<<<<<< HEAD\n  tests: {}\n=======\n>>>>>>> upstream/main\n")


if __name__ == "__main__":
    unittest.main()
