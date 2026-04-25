# Fix all controller export errors
# This script will find and fix all duplicate module.exports in controller files

$controllersPath = "D:\Projects\Hospital\backend\controllers"
$files = @(
    "pharmacyPurchaseController.js",
    "pharmacyInventoryController.js",
    "pharmacyBillingController.js",
    "patientPrescriptionHelpers.js",
    "notificationController.js",
    "labRequestController.js",
    "laboratoryController.js",
    "labAnalyticsController.js"
)

foreach ($file in $files) {
    $filePath = Join-Path $controllersPath $file
    
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        # Check if file uses exports.functionName pattern
        if ($content -match 'exports\.\w+\s*=') {
            # Remove module.exports = { ... } block at the end
            $content = $content -replace 'module\.exports\s*=\s*\{[^}]*\};?\s*$', '// All functions already exported via exports.functionName above'
            
            # Write back
            $content | Set-Content $filePath -NoNewline
            Write-Host "Fixed: $file" -ForegroundColor Green
        }
    }
}

Write-Host "`nAll controller export errors fixed!" -ForegroundColor Cyan
