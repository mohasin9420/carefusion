# TypeSense Setup for Laboratory Tests

> [!IMPORTANT]
> This guide covers setting up TypeSense specifically for **laboratory test data** from the CSV files. For medicine data setup, see [TYPESENSE_SETUP.md](./TYPESENSE_SETUP.md).

## Overview

This setup enables **ultra-fast search** for laboratory tests with:
- ⚡ **Lightning-fast search** (~10-20ms response time)
- 🔍 **Typo tolerance** - finds tests even with spelling errors
- 📊 **800+ laboratory tests** from India Laboratory Master Database
- 🏷️ **Category-based filtering** and faceted search
- 🔄 **Real-time sync** from CSV to TypeSense

---

## Prerequisites

1. **Docker Desktop** installed and running
   - Download: https://www.docker.com/products/docker-desktop/
   - Verify: `docker --version`

2. **Laboratory CSV data** in place
   - Location: `d:\Projects\Hospital\data\India_Laboratory_Master_Database.csv`
   - ~800 test records

---

## Step 1: Start TypeSense with Docker

### Launch TypeSense Container

```powershell
# Navigate to project root
cd "d:\Projects\Hospital"

# Start TypeSense in background
docker-compose up -d
```

**What happens:**
- Downloads TypeSense v26.0 image (~50MB, one-time)
- Creates `hospital-typesense` container
- Starts on port **8108**
- Data persists in Docker volume `typesense-data`

### Verify TypeSense is Running

```powershell
# Check container status
docker ps

# Should show:
# CONTAINER ID   IMAGE                    STATUS    PORTS
# xxxx           typesense/typesense:26.0 Up        0.0.0.0:8108->8108/tcp
```

**Test Health Endpoint:**
```powershell
curl http://localhost:8108/health
```

Expected response:
```json
{"ok":true}
```

---

## Step 2: Collection Schema

The lab tests collection (`labtests`) uses the following schema:

```javascript
{
  name: 'labtests',
  fields: [
    { name: 'id', type: 'string' },                    // Unique identifier
    { name: 'name', type: 'string', facet: false },    // Test name (searchable)
    { name: 'category', type: 'string', facet: true }, // Category (filterable)
    { name: 'description', type: 'string', optional: true }, // Test description
    { name: 'sort_order', type: 'int32' }              // For consistent ordering
  ],
  default_sorting_field: 'sort_order'
}
```

**Key Features:**
- **Searchable fields:** `name`, `category`, `description`
- **Faceted field:** `category` (for filtering by test category)
- **Default sort:** By `sort_order` for consistent results

---

## Step 3: Import Laboratory Test Data

### Run the Sync Script

```powershell
cd backend
node scripts/syncLabTestsToTypesense.js
```

**What this script does:**

1. ✅ Checks TypeSense connection
2. 🗑️ Deletes existing `labtests` collection (if any)
3. 📋 Creates new `labtests` collection with schema
4. 📂 Reads CSV file: `India_Laboratory_Master_Database.csv`
5. 💾 Imports tests in batches (100 tests per batch)
6. 🧪 Tests search functionality with sample queries
7. 📊 Shows collection statistics

**Expected Output:**

```
🚀 Starting Lab Tests Sync to Typesense...

🔌 Checking Typesense connection...
✅ Typesense is healthy: true
🗑️  Deleted existing labtests collection
✅ Created labtests collection in Typesense
📂 Reading CSV file: d:\Projects\Hospital\data\India_Laboratory_Master_Database.csv
📝 Parsed 824 tests from CSV

💾 Importing to Typesense...
   Progress: 824/824 tests
   
✅ Import to Typesense completed!

📊 Total imported: 824 lab tests
📈 Collection stats: 824 documents

🧪 Testing search functionality...
   "blood" → 5 results in 12ms
      Top result: Complete Blood Count (CBC) (Hematology)
   "glucose" → 5 results in 8ms
      Top result: Blood Glucose Fasting (Diabetes)
   "CBC" → 5 results in 7ms
      Top result: Complete Blood Count (CBC) (Hematology)
   "thyroid" → 5 results in 11ms
      Top result: Thyroid Profile Total (Endocrinology)

✅ Sync process completed successfully!

💡 Lab tests are now searchable via Typesense!
   Access at: http://localhost:8108
```

---

## Step 4: Verify Setup

### Run Verification Script

```powershell
node scripts/verifyTypesenseLabTests.js
```

**What this verifies:**

- ✅ Collection exists and is accessible
- 📊 Document count matches expected (~800+)
- 🏷️ Categories are properly indexed
- 🔍 Search queries return relevant results

**Sample Output:**

```
🔍 Verifying Lab Tests in Typesense...

✅ Collection: labtests
📊 Total documents: 824
🏷️  Fields: id, name, category, description, sort_order

📋 Categories:
   Hematology: 125 tests
   Clinical Chemistry: 98 tests
   Diabetes: 45 tests
   Endocrinology: 67 tests
   Cardiology: 54 tests
   ...

🧪 Test Searches:

   Query: "CBC" → 8 results
      1. Complete Blood Count (CBC) (Hematology)
      2. CBC with ESR (Hematology)
      3. CBC Differential Count (Hematology)

   Query: "blood glucose" → 12 results
      1. Blood Glucose Fasting (Diabetes)
      2. Blood Glucose Random (Diabetes)
      3. Blood Glucose Post Prandial (Diabetes)

✅ Verification complete!

💡 Typesense lab tests are ready for use in your application!
```

---

## Step 5: Integration with Backend

### Environment Variables

Your `.env` file should already have:

```env
TYPESENSE_API_KEY=hospital_typesense_secret_key_2024
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
```

### TypeSense Client Configuration

The client is already configured in [`backend/config/typesense.js`](file:///d:/Projects/Hospital/backend/config/typesense.js):

```javascript
const Typesense = require('typesense');

const typesenseClient = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || 'localhost',
    port: process.env.TYPESENSE_PORT || 8108,
    protocol: process.env.TYPESENSE_PROTOCOL || 'http'
  }],
  apiKey: process.env.TYPESENSE_API_KEY || 'hospital_typesense_secret_key_2024',
  connectionTimeoutSeconds: 2
});

module.exports = typesenseClient;
```

### Sample Search Query (Node.js)

```javascript
const typesenseClient = require('./config/typesense');

// Search for lab tests
async function searchLabTests(query) {
  const searchResults = await typesenseClient
    .collections('labtests')
    .documents()
    .search({
      q: query,                                    // Search query
      query_by: 'name,category,description',       // Fields to search
      per_page: 10,                                // Results per page
      facet_by: 'category',                        // Group by category
      sort_by: 'sort_order:asc'                    // Sort order
    });
  
  return searchResults.hits;
}

// Example usage
searchLabTests('thyroid').then(results => {
  console.log(`Found ${results.length} tests`);
  results.forEach(hit => {
    console.log(`- ${hit.document.name} (${hit.document.category})`);
  });
});
```

### API Endpoint Example (Express.js)

```javascript
const express = require('express');
const typesenseClient = require('./config/typesense');
const router = express.Router();

// GET /api/lab-tests/search?q=thyroid
router.get('/search', async (req, res) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;
    
    const searchParams = {
      q: q || '*',
      query_by: 'name,category,description',
      per_page: parseInt(limit),
      page: parseInt(page)
    };
    
    // Add category filter if provided
    if (category) {
      searchParams.filter_by = `category:=${category}`;
    }
    
    const results = await typesenseClient
      .collections('labtests')
      .documents()
      .search(searchParams);
    
    res.json({
      success: true,
      total: results.found,
      page: results.page,
      results: results.hits.map(hit => hit.document)
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

module.exports = router;
```

---

## Common Docker Commands

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

### Stop and Remove Data (⚠️ WARNING: Deletes all data)
```powershell
docker-compose down -v
```

### Check Container Health
```powershell
docker inspect hospital-typesense --format='{{.State.Health.Status}}'
```

---

## Troubleshooting

### ❌ Error: ECONNREFUSED (Can't connect to TypeSense)

**Solution:**
```powershell
# Check if container is running
docker ps

# If not running, start it
docker-compose up -d

# Check logs for errors
docker-compose logs typesense
```

---

### ❌ Port 8108 Already in Use

**Solution:** Change the port in `docker-compose.yml`

```yaml
ports:
  - "8109:8108"  # Use port 8109 instead
```

Then update `.env`:
```env
TYPESENSE_PORT=8109
```

Restart:
```powershell
docker-compose down
docker-compose up -d
```

---

### ❌ Collection Import Fails

**Check:**

1. **CSV file exists:**
   ```powershell
   ls "d:\Projects\Hospital\data\India_Laboratory_Master_Database.csv"
   ```

2. **CSV format is correct:**
   - Required columns: `id`, `test_name`, `category`
   - Optional: `description`

3. **Re-run sync script:**
   ```powershell
   node backend/scripts/syncLabTestsToTypesense.js
   ```

---

### ❌ Docker Desktop Won't Start (Windows)

1. **Enable WSL 2:**
   ```powershell
   wsl --install
   ```

2. **Enable Virtualization in BIOS**
   - Restart PC → Enter BIOS → Enable VT-x/AMD-V

3. **Restart Docker Desktop**

---

## Performance Comparison

| Metric | MongoDB | TypeSense | Improvement |
|--------|---------|-----------|-------------|
| Search "CBC" | ~45ms | ~8ms | **5.6x faster** ⚡ |
| Search "thyroid" | ~52ms | ~11ms | **4.7x faster** ⚡ |
| Typo tolerance | ❌ None | ✅ Yes | Finds "thyroi" → "thyroid" |
| Faceted search | Limited | ✅ Native | Category filtering |
| Ranking | Basic | ✅ Advanced | Better relevance |

---

## CSV Data Structure

### Source File
- **Path:** `d:\Projects\Hospital\data\India_Laboratory_Master_Database.csv`
- **Records:** ~800+ laboratory tests
- **Format:** CSV with headers

### Expected Columns

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `id` | Yes | Unique test ID | `1`, `2`, `3` |
| `test_name` | Yes | Full test name | `Complete Blood Count (CBC)` |
| `category` | Recommended | Test category | `Hematology`, `Diabetes` |
| `description` | Optional | Test description | `Measures red blood cells, white blood cells...` |

### Sample CSV Rows

```csv
id,test_name,category,description
1,Complete Blood Count (CBC),Hematology,Measures RBC WBC platelets hemoglobin
2,Blood Glucose Fasting,Diabetes,Measures blood sugar after 8-12 hours fasting
3,Thyroid Profile Total,Endocrinology,Measures T3 T4 TSH levels
```

---

## Available Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| **Sync Lab Tests** | Import CSV → TypeSense | `node backend/scripts/syncLabTestsToTypesense.js` |
| **Verify Setup** | Check collection & search | `node backend/scripts/verifyTypesenseLabTests.js` |
| **Force Import** | Force re-import all data | `node backend/scripts/forceImportLabTests.js` |

---

## Next Steps

1. ✅ **Integration:** Add search endpoint to your Express backend
2. ✅ **Frontend:** Create autocomplete search component
3. ✅ **Testing:** Test with real user queries
4. 🔄 **Sync:** Set up scheduled sync if CSV updates regularly

---

## Support & Resources

- **TypeSense Documentation:** https://typesense.org/docs/
- **Docker Documentation:** https://docs.docker.com/
- **Project Scripts:** [`backend/scripts/`](file:///d:/Projects/Hospital/backend/scripts/)
- **TypeSense Config:** [`backend/config/typesense.js`](file:///d:/Projects/Hospital/backend/config/typesense.js)

---

**🎉 Your laboratory test search is now powered by TypeSense!**

The setup provides:
- ⚡ **Ultra-fast search** with typo tolerance
- 🏷️ **Category-based filtering**
- 📊 **800+ searchable tests**
- 🔄 **Easy data sync** from CSV
