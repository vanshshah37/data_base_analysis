# PowerShell script to generate Excel Invoice & PI via COM Automation
param (
    [string]$jsonPath
)

# Set output encoding to UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Helper function to safely set Excel cell value, handling numeric casting issues
function Set-CellValue($sheet, $row, $col, $value) {
    if ($null -eq $value) {
        $sheet.Cells.Item($row, $col).Value2 = ""
    } elseif ($value -is [int] -or $value -is [double] -or $value -is [decimal]) {
        $sheet.Cells.Item($row, $col).Value2 = $value.ToString()
    } else {
        $sheet.Cells.Item($row, $col).Value2 = $value
    }
}

if (-not (Test-Path $jsonPath)) {
    Write-Error "JSON input file not found: $jsonPath"
    Exit 1
}

# Load JSON data
try {
    $data = Get-Content -Raw -Path $jsonPath | ConvertFrom-Json
}
catch {
    Write-Error "Failed to parse JSON file: $_"
    Exit 1
}

$type = $data.type
$templatePath = $data.templatePath
$outputExcelPath = $data.outputExcelPath
$outputPdfPath = $data.outputPdfPath

# Ensure output directory exists
$outputDir = Split-Path $outputExcelPath -Parent
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

try {
    Write-Host "Initializing Excel Application..."
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false

    Write-Host "Opening template: $templatePath..."
    $wb = $excel.Workbooks.Open($templatePath)

    if ($type -eq "pi") {
        # Process PI
        $sheet = $wb.Sheets.Item("invoice")
        if (-not $sheet) {
            throw "Sheet 'invoice' not found in PI template"
        }

        Write-Host "Populating PI details..."
        # Customer
        Set-CellValue $sheet 9 4 $data.customer.name
        Set-CellValue $sheet 10 4 $data.customer.addressLine1
        Set-CellValue $sheet 11 4 $data.customer.addressLine2
        Set-CellValue $sheet 12 4 $data.customer.addressLine3
        Set-CellValue $sheet 13 4 $data.customer.phone
        Set-CellValue $sheet 14 4 $data.customer.gstin
        
        if ($data.customer.attention) {
            Set-CellValue $sheet 16 2 "KINDLY ADDT: MR. $($data.customer.attention.ToUpper())"
        } else {
            Set-CellValue $sheet 16 2 ""
        }

        # Metadata
        Set-CellValue $sheet 9 11 ([int]$data.bookNo)
        Set-CellValue $sheet 10 11 $data.invoiceNo
        Set-CellValue $sheet 11 11 $data.date
        Set-CellValue $sheet 12 11 $data.buyerOrderNo
        Set-CellValue $sheet 13 11 $data.buyerOrderDate
        Set-CellValue $sheet 14 11 $data.vehicleNo

        # Items
        for ($i = 0; $i -lt 3; $i++) {
            $rowNum = 19 + $i * 2
            if ($i -lt $data.items.Count) {
                $item = $data.items[$i]
                Set-CellValue $sheet $rowNum 2 ($i + 1) # Sr No
                Set-CellValue $sheet $rowNum 3 $item.name
                Set-CellValue $sheet ($rowNum + 1) 3 $item.description
                Set-CellValue $sheet $rowNum 5 $item.hsn
                Set-CellValue $sheet $rowNum 6 ([double]$item.gstRate)
                Set-CellValue $sheet $rowNum 7 ([double]$item.rate)
                Set-CellValue $sheet $rowNum 8 ([int]$item.qty)
                $sheet.Cells.Item($rowNum, 9).Formula = "=G$rowNum*H$rowNum"
                $sheet.Cells.Item($rowNum, 11).Formula = "=I$rowNum*(1+F$rowNum)"
            } else {
                # Clear empty slots
                Set-CellValue $sheet $rowNum 2 ""
                Set-CellValue $sheet $rowNum 3 ""
                Set-CellValue $sheet ($rowNum + 1) 3 ""
                Set-CellValue $sheet $rowNum 5 ""
                Set-CellValue $sheet $rowNum 6 ""
                Set-CellValue $sheet $rowNum 7 ""
                Set-CellValue $sheet $rowNum 8 ""
                Set-CellValue $sheet $rowNum 9 ""
                Set-CellValue $sheet $rowNum 11 ""
            }
        }

        # Totals and Words
        $sheet.Cells.Item(29, 11).Formula = "=SUM(I19,I21,I23)"
        $sheet.Cells.Item(31, 11).Formula = "=K29*0.09"
        $sheet.Cells.Item(32, 11).Formula = "=K29*0.09"
        $sheet.Cells.Item(34, 11).Formula = "=K29+K31+K32"
        Set-CellValue $sheet 35 4 $data.amountInWords

    } else {
        # Process Invoice (sheets: Table 1, DUPL, TRI)
        $sheetsToEdit = @("Table 1", "DUPL", "TRI")
        
        foreach ($sheetName in $sheetsToEdit) {
            $sheet = $wb.Sheets.Item($sheetName)
            if (-not $sheet) {
                Write-Host "Warning: Sheet '$sheetName' not found."
                continue
            }
            
            Write-Host "Populating sheet: $sheetName..."
            
            # Metadata
            Set-CellValue $sheet 3 6 $data.invoiceNo
            Set-CellValue $sheet 3 10 $data.date
            Set-CellValue $sheet 4 6 $data.deliveryNote
            Set-CellValue $sheet 5 10 $data.paymentTerms
            Set-CellValue $sheet 9 6 $data.buyerOrderNo
            Set-CellValue $sheet 9 10 $data.buyerOrderDate
            Set-CellValue $sheet 13 6 $data.despatchedThrough
            Set-CellValue $sheet 13 10 $data.destination

            # Buyer (Bill to) - A11 to A14
            Set-CellValue $sheet 11 1 $data.customer.name
            Set-CellValue $sheet 12 1 $data.customer.addressLine1
            Set-CellValue $sheet 13 1 $data.customer.addressLine2
            Set-CellValue $sheet 14 1 $data.customer.addressLine3
            
            if ($data.customer.gstin) {
                Set-CellValue $sheet 18 1 "GSTIN/UIN: $($data.customer.gstin)"
            } else {
                Set-CellValue $sheet 18 1 ""
            }
            
            if ($data.customer.stateName) {
                Set-CellValue $sheet 19 1 "State Name : $($data.customer.stateName), Code : $($data.customer.stateCode)"
            } else {
                Set-CellValue $sheet 19 1 ""
            }

            # Consignee (Shipped to) - F15 to F18
            Set-CellValue $sheet 15 6 $data.consignee.name
            Set-CellValue $sheet 16 6 $data.consignee.addressLine1
            Set-CellValue $sheet 17 6 $data.consignee.addressLine2
            Set-CellValue $sheet 18 6 $data.consignee.addressLine3
            
            if ($data.consignee.gstin) {
                Set-CellValue $sheet 19 6 "GSTIN/UIN: $($data.consignee.gstin)"
            } else {
                Set-CellValue $sheet 19 6 ""
            }
            
            if ($data.consignee.stateName) {
                Set-CellValue $sheet 20 6 "State Name: $($data.consignee.stateName), Code : $($data.consignee.stateCode)"
            } else {
                Set-CellValue $sheet 20 6 ""
            }

            # Items (Rows 23, 26, 29)
            for ($i = 0; $i -lt 3; $i++) {
                $rowNum = 23 + $i * 3
                if ($i -lt $data.items.Count) {
                    $item = $data.items[$i]
                    Write-Host "Item ${i} - Row ${rowNum}"
                    
                    Write-Host "Writing Sr No to ($rowNum, 1)..."
                    Set-CellValue $sheet $rowNum 1 ($i + 1)
                    
                    Write-Host "Writing Name to ($rowNum, 2)..."
                    Set-CellValue $sheet $rowNum 2 $item.name
                    
                    Write-Host "Writing Description to ($rowNum + 1, 2)..."
                    Set-CellValue $sheet ($rowNum + 1) 2 $item.description
                    
                    Write-Host "Writing Serials to ($rowNum + 2, 2)..."
                    if ($item.serialNumbers) {
                        Set-CellValue $sheet ($rowNum + 2) 2 "Serial No.$($item.serialNumbers)"
                    } else {
                        Set-CellValue $sheet ($rowNum + 2) 2 ""
                    }
                    
                    Write-Host "Writing HSN to ($rowNum, 4)..."
                    Set-CellValue $sheet $rowNum 4 $item.hsn
                    
                    Write-Host "Writing Qty to ($rowNum, 6)..."
                    Set-CellValue $sheet $rowNum 6 ([int]$item.qty)
                    
                    Write-Host "Writing Per to ($rowNum, 7)..."
                    Set-CellValue $sheet $rowNum 7 $item.per
                    
                    Write-Host "Writing Rate to ($rowNum, 8)..."
                    Set-CellValue $sheet $rowNum 8 ([double]$item.rate)
                    
                    Write-Host "Writing Formula to ($rowNum, 9)..."
                    $sheet.Cells.Item($rowNum, 9).Formula = "=F$rowNum*H$rowNum"
                    
                    Write-Host "Writing CGST Rate to ($rowNum, 10)..."
                    Set-CellValue $sheet $rowNum 10 ([double]$item.gstRate / 2.0)
                    
                    Write-Host "Writing CGST Formula to ($rowNum, 11)..."
                    $sheet.Cells.Item($rowNum, 11).Formula = "=I$rowNum*J$rowNum"
                    
                    Write-Host "Writing SGST Rate to ($rowNum, 12)..."
                    Set-CellValue $sheet $rowNum 12 ([double]$item.gstRate / 2.0)
                    
                    Write-Host "Writing SGST Formula to ($rowNum, 13)..."
                    $sheet.Cells.Item($rowNum, 13).Formula = "=I$rowNum*L$rowNum"
                } else {
                    # Clear empty slots
                    Set-CellValue $sheet $rowNum 1 ""
                    Set-CellValue $sheet $rowNum 2 ""
                    Set-CellValue $sheet ($rowNum + 1) 2 ""
                    Set-CellValue $sheet ($rowNum + 2) 2 ""
                    Set-CellValue $sheet $rowNum 4 ""
                    Set-CellValue $sheet $rowNum 6 ""
                    Set-CellValue $sheet $rowNum 7 ""
                    Set-CellValue $sheet $rowNum 8 ""
                    Set-CellValue $sheet $rowNum 9 ""
                    Set-CellValue $sheet $rowNum 10 ""
                    Set-CellValue $sheet $rowNum 11 ""
                    Set-CellValue $sheet $rowNum 12 ""
                    Set-CellValue $sheet $rowNum 13 ""
                }
            }

            # Summary Totals and Formulas
            $sheet.Cells.Item(34, 6).Formula = "=SUM(F23,F26,F29)"
            $sheet.Cells.Item(34, 9).Formula = "=SUM(I23,I26,I29)"
            $sheet.Cells.Item(34, 11).Formula = "=SUM(K23,K26,K29)"
            $sheet.Cells.Item(34, 13).Formula = "=SUM(M23,M26,M29)"

            $sheet.Cells.Item(35, 13).Formula = "=I34"
            $sheet.Cells.Item(36, 13).Formula = "=K34"
            $sheet.Cells.Item(37, 13).Formula = "=M34"
            $sheet.Cells.Item(39, 13).Formula = "=M35+M36+M37"
            
            Set-CellValue $sheet 39 1 "Rs. in words : $($data.amountInWords)"
        }
    }

    # Save to trigger formulas calculation in Excel
    Write-Host "Saving Excel workbook to: $outputExcelPath..."
    
    # Remove existing files to prevent Excel COM overwrite dialog suppression failures
    if (Test-Path $outputExcelPath) {
        Remove-Item $outputExcelPath -Force | Out-Null
    }
    if (Test-Path $outputPdfPath) {
        Remove-Item $outputPdfPath -Force | Out-Null
    }

    # Format 51 = XLSX, Format 52 = XLSM (with macros)
    $fileFormat = 51
    if ($outputExcelPath.EndsWith(".xlsm")) {
        $fileFormat = 52
    }
    
    $wb.SaveAs($outputExcelPath, $fileFormat)

    # Force calculate formulas so cached values are updated
    $excel.Calculate()
    $wb.Save()

    Write-Host "Exporting PDF to: $outputPdfPath..."
    # Export as PDF (Type 0)
    $wb.ExportAsFixedFormat(0, $outputPdfPath)

    Write-Host "Closing workbook..."
    $wb.Close($false)
    $excel.Quit()
    
    Write-Host "Excel and PDF generated successfully!"
    Exit 0
}
catch {
    $line = $_.InvocationInfo.ScriptLineNumber
    Write-Error "Error occurred in Excel COM at line ${line}: $_. Stack trace: $($_.ScriptStackTrace)"
    if ($wb) { $wb.Close($false) }
    if ($excel) { $excel.Quit() }
    Exit 1
}
finally {
    # Release COM references from memory
    if ($sheet) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($sheet) | Out-Null }
    if ($wb) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) | Out-Null }
    if ($excel) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
