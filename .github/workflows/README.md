# CI/CD Pipeline

This repository uses GitHub Actions for Continuous Integration (CI) and Continuous Deployment (CD).

- **Workflow file:** `.github/workflows/cd.yml`
- **Trigger:** Runs on every push to the `main` branch.

## Continuous Integration (CI)
- Checks out the latest code from the repository.
- Builds Docker images for backend, frontend, and simulator to ensure code and dependencies are correct.
- Verifies that the build process completes successfully for all components.

## Continuous Deployment (CD)
- Authenticates to GitHub Container Registry (GHCR).
- Pushes the built Docker images to GHCR with tags: `latest` and the current commit SHA.
- Makes the new images available for deployment or further use.

**Note:**
- All images are stored in the GitHub Container Registry under your repository namespace.
- You need to be authenticated to GHCR to pull private images. Use a GitHub personal access token with `read:packages` scope.

For more details, see the [`cd.yml`](./cd.yml) workflow file.
