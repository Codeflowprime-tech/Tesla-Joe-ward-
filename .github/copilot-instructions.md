# Project Guidelines

## Vercel Build and Dependency Compatibility

- Treat `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `vercel.json` as one deployment contract. Keep package-manager, install, lifecycle-script, and build settings compatible across all four files.
- This project uses pnpm `12.16.1` and Vite. Keep `package.json`'s `packageManager` field aligned with the lockfile; when changing pnpm versions, regenerate the lockfile with that version and verify the Vercel install and build.
- Use pnpm for dependency changes. Add each imported package as a direct dependency in the correct section of `package.json`, and commit the corresponding `pnpm-lock.yaml` update. Do not introduce npm or Yarn lockfiles or rely on undeclared transitive dependencies.
- Preserve Vercel's frozen-lockfile install behavior and the existing Vite build output (`dist`). If changing the install command, build command, output directory, or SPA rewrites, update the related configuration together and verify the deployment behavior.
- The Vercel install command disables lifecycle scripts. Before adding or upgrading a dependency that needs an install/build script or native binary, check its requirements and make the required, compatible changes to the Vercel install command and pnpm build-script allow-list. Do not silently weaken existing install or dependency safeguards.
- Before finishing changes that affect dependencies, build configuration, or deployable code, run the Vercel install command from `vercel.json` and `pnpm run build`. Resolve failures rather than treating a successful local development server as proof of deployment compatibility.
