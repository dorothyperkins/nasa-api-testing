# NASA API Testing (Postman + Newman)

End-to-end example of API testing with assertions against several **NASA Open APIs** using **Postman** collections executed by **Newman** (CLI). Includes a GitHub Actions workflow to run the tests on each push/PR and publish an HTML report.

## 1) Prerequisites
- Node.js 18+
- (Optional) Postman Desktop to explore requests
- A **NASA API key** (free): https://api.nasa.gov/  

  > DEMO_KEY rate limits are **30 req/hour, 50 req/day**; get your own key for CI. 

## 2) Install & Run Locally
```bash
# from this folder
npm install

# Option A: use env file value (DEMO_KEY by default)
npm run test:api

# Option B: override the key at runtime
npx newman run postman/nasa-openapis.postman_collection.json   -e postman/nasa-env.postman_environment.json   --env-var "api_key=YOUR_REAL_KEY"   --reporters cli,htmlextra   --reporter-htmlextra-export reports/newman.html
```

Reports land in `reports/newman.html`.

## 3) Project Layout
```
postman/
  nasa-openapis.postman_collection.json
  nasa-env.postman_environment.json
.github/workflows/
  ci.yml
reports/
  (html report output)
```

## 4) What’s Tested (Assertions)
- **APOD** `/planetary/apod`  
  Status, required fields, media-specific checks, response time, date matches request.
- **Asteroids NeoWs Feed** `/neo/rest/v1/feed`  
  `element_count` equals the sum of actual NEOs returned; date-window sanity checks.
- **Mars Rover Photos** `/mars-photos/.../curiosity/photos`  
  Array shape and key fields when photos exist.
- **EPIC (Natural)** `/EPIC/api/natural`  
  Returns an array and key metadata fields on items when present.
- **Negative Test** APOD without `api_key` (expects 400/403 and helpful error content).

Dates default to a safe recent window (UTC) and can be overridden in `postman/nasa-env.postman_environment.json`.

## 5) CI Pipeline (GitHub Actions)
- Stores no secrets in repo.
- Reads `NASA_API_KEY` from repository **Secrets**.
- Publishes the HTML report as a workflow artifact.

To enable:
1. Push this repo to GitHub.
2. In **Settings → Secrets and variables → Actions → New repository secret**, add `NASA_API_KEY`.
3. Commit & push; the workflow runs automatically.

## 6) Presenting As Proof
- Keep the **Newman HTML report** from a successful run (`reports/newman.html`) in your PR artifacts or attach screenshots in your portfolio.
- Add a short screencast showing `npm run test:api` and a quick look at the report.
- In your CV/README: “Built a Postman collection + Newman CI pipeline validating NASA Open APIs with dynamic date handling, positive & negative tests, and HTML reporting.”


