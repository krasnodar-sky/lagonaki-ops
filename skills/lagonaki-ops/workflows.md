# Workflows

## 1. Sale
Input: free text like '3 borscht and 2 colas'
1. Split into items (by 'and', comma, newline)
2. For each: extract qty + name, fuzzy-match SKU in Goods sheet
3. Handle Russian cases: 'borscha' -> 'Borscht', 'koly' -> 'Cola'
4. Check stock: if < requested qty, warn user
5. Calculate total = qty * price (column 4 in Goods)
6. Append to Operations: [date MSK, 'sale', 'FT', SKU, name, qty, price, total, 'Admin', '']
7. Update Goods: Stock -= qty, recalc Status
8. Update Dashboard: revenue by category, salary, portions
9. Reply with confirmation and totals

## 2. Writeoff
Input: 'write off 1 tom yam for team'
Same as sale but Type='writeoff', not counted in revenue, counted in Dashboard 'writeoffs'.

## 3. Cancel last operation
1. Find last row in Operations
2. Add row with negative qty and comment 'cancel'
3. Restore stock in Goods
4. Recalc Dashboard

## 4. Repair photo analysis
Input: photo + optional text
1. Analyze image (multimodal)
2. Determine: object (C1-C4/B1/FT/AREA), category (carpentry/plumbing/electrical/general)
3. Assess urgency 1-5 (1=cosmetic, 5=guest danger)
4. Generate ID: R + next number
5. Write to Repairs sheet
6. If urgency >= 4, notify owner

## 5. Supply intake
Input: 'received 24 colas at 53 from Magnit'
1. Parse items, find SKU
2. Append to Supplies: [date, SKU, name, qty, buy_price, total, supplier, who, '']
3. Update Goods: Stock += qty
4. If buy price changed, update Cost and Margin in Goods

## 6. Shopping list
View: read Shopping where Status='needed', sort by priority
Add: append [date, ID, name, qty, object, priority, who, 'needed', '', '']

## 7. Report
Input: 'report for last week'
1. Determine period dates
2. Run: node /root/lagonaki/scripts/monthly-report.js YYYY-MM-DD YYYY-MM-DD
3. Or: read Operations via gws-sheets, compute KPIs, return in chat

## 8. Fuzzy search aliases
borsch/borscha -> Q05, tom yam/tomyam -> Q06, lapsha -> Q07, carbonara -> Q12, miso/ryba -> Q13, gedze -> Q14, brauni -> Q17, kotlety -> Q18, lyulya -> Q19, kola/koly -> F04, kvas -> F05, baltika/pivo -> F06, sok/soka -> F07, snikers -> F10, tviks -> F11, chai -> F13
