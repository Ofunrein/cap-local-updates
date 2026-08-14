# Cap 2 update source

Public upstream-tracking fork and release channel for Martin's local-first Cap 2 build.

- `main` fast-forwards from [`CapSoftware/Cap`](https://github.com/CapSoftware/Cap) every six hours.
- `.cap2/cap2.patch` carries the separate bundle identity, local-only entitlement behavior, and public updater endpoint.
- Signed update packages are published under [Releases](../../releases).
- Installed Cap 2 applications check `releases/latest/download/latest.json` automatically.
- Cap-hosted storage, sharing, collaboration, billing, and hosted AI are not recreated or bypassed.

The private ClaudeMD repository tracks the latest release pointer and contains the local publisher/rebuild automation.
