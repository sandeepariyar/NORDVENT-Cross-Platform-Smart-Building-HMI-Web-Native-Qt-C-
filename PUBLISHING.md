# Publish the complete NORDVENT Engineering Lab

**Current state:** A standalone landing page has already been committed at `docs/index.html`. You may enable GitHub Pages now on `main /docs` to publish that initial page. It includes a functional standalone simulator inspector, and clearly marks the original web application and Qt source as pending until the full upload.

The full source package (web v17, native Qt v17.1 and the engineering showcase) contains hundreds of files and photographic PNG/WebP assets. The linked GitHub connector can initialize repository text files but cannot upload the complete ZIP archive or its binary contents directly. Do not mistake this bootstrap state for a complete deployment.

## Creator-only upload (Windows)

1. Download and extract `NORDVENT_Engineering_Lab_Ready_To_Publish.zip` from the project conversation.
2. Verify that the extracted folder contains `docs/index.html`, `docs/web/index.html`, `native-qt/CMakeLists.txt` and `Publish-NORDVENT.ps1`.
3. Open PowerShell **inside the extracted folder** and run:
   ```powershell
   powershell -NoProfile -File .\Publish-NORDVENT.ps1
   ```
4. Authenticate to GitHub through your Git credential manager when prompted. The script clones **only this repository**, copies the files, creates a normal commit, and pushes to `main` without force.
5. Check that `docs/index.html`, `docs/web/assets` and `native-qt/assets` are present in the GitHub repository.

## Enable GitHub Pages

In repository Settings → Pages, choose **Deploy from a branch** → **main** → **/docs**, then Save.

Expected deployment URL after GitHub Pages finishes:

https://sandeepariyar.github.io/NORDVENT-Cross-Platform-Smart-Building-HMI-Web-Native-Qt-C-/

The native Qt panel is a clearly labeled source/reference preview; a working Qt WebAssembly build has **not** been published.

## Copyright

© 2026 Sandeep Pariyar. All rights reserved. Not MIT. Third-party dependencies retain their separate licenses.
