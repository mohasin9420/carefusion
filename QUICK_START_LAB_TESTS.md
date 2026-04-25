# TypeSense Lab Tests - Quick Start

> **5-Minute Setup Guide** for laboratory test search with TypeSense + Docker

## ⚡ Quick Commands

```powershell
# 1. Start TypeSense
cd "d:\Projects\Hospital"
docker-compose up -d

# 2. Import Lab Tests
cd backend
node scripts/syncLabTestsToTypesense.js

# 3. Verify Setup
node scripts/verifyTypesenseLabTests.js
```

**Done! 🎉** TypeSense is now running with 800+ searchable lab tests.

---

## ✅ Verification Checklist

After running the commands above, verify:

- [ ] **Docker container running**
  ```powershell
  docker ps | findstr hospital-typesense
  ```
  
- [ ] **Health check passing**
  ```powershell
  curl http://localhost:8108/health
  # Expected: {"ok":true}
  ```
  
- [ ] **Collection created**
  ```powershell
  node backend/scripts/verifyTypesenseLabTests.js
  # Expected: "✅ Collection: labtests"
  # Expected: "📊 Total documents: 824"
  ```
  
- [ ] **Search working**
  - Test searches for `CBC`, `glucose`, `thyroid` should return results in ~10ms

---

## 🔍 Test Search (PowerShell)

```powershell
curl "http://localhost:8108/collections/labtests/documents/search?q=CBC&query_by=name,category&x-typesense-api-key=hospital_typesense_secret_key_2024"
```

---

## 📂 File Structure

```
Hospital/
├── docker-compose.yml                        # TypeSense Docker config
├── TYPESENSE_LAB_TESTS_SETUP.md             # Full setup guide (you are here!)
├── backend/
│   ├── config/
│   │   └── typesense.js                     # TypeSense client config
│   └── scripts/
│       ├── syncLabTestsToTypesense.js       # Import CSV → TypeSense
│       ├── verifyTypesenseLabTests.js       # Verify setup
│       └── forceImportLabTests.js           # Force re-import
└── data/
    └── India_Laboratory_Master_Database.csv # 800+ lab tests (source)
```

---

## 🛠️ Common Tasks

### Re-sync Data (if CSV updated)
```powershell
cd backend
node scripts/syncLabTestsToTypesense.js
```

### View TypeSense Logs
```powershell
docker-compose logs -f typesense
```

### Restart TypeSense
```powershell
docker-compose restart typesense
```

### Stop TypeSense
```powershell
docker-compose down
```

---

## 📖 Full Documentation

For complete details, see: [`TYPESENSE_LAB_TESTS_SETUP.md`](./TYPESENSE_LAB_TESTS_SETUP.md)

Includes:
- Docker configuration details
- Collection schema documentation
- API integration examples (Node.js + Express)
- Troubleshooting guide
- Performance benchmarks
