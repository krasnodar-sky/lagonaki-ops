# Data Model - Google Sheets v3

Spreadsheet ID: 1X1Z9T9QUxNY0faFyqjQeJDgwNjFHuh4lRkZDnnbyLDM

## Objects (A:F)
ID(0) Name(1) Type(2) Desc(3) Capacity(4) Status(5)
C1-C4 cabins, B1 bath, FT foodtruck, AREA common

## Goods (A:J)
ID(0) Name(1) Category(2) Subcategory(3) Price(4) Cost(5) Margin(6) Stock(7) MinStock(8) Status(9)
Q01-Q19 QUMMY, F01-F13 FOODBOX. On sale: Stock -= qty, recalc Status.

## Operations (A:J)
DateTime(0) Type(1) Object(2) SKU(3) Name(4) Qty(5) Price(6) Total(7) Who(8) Comment(9)
Types: sale, writeoff. Append-only. Cancel = negative qty row.

## Supplies (A:I)
Date(0) SKU(1) Name(2) Qty(3) BuyPrice(4) Total(5) Supplier(6) Who(7) Comment(8)
On supply: Stock += qty in Goods sheet.

## Repairs (A:J)
ID(0) Date(1) Object(2) Category(3) Desc(4) Urgency(5) Photo(6) Status(7) ResolveDate(8) Comment(9)
ID format: R001. Urgency 1-5. Statuses: new/in_progress/done/closed.

## Shopping (A:J)
Date(0) SKU(1) Name(2) Qty(3) Object(4) Priority(5) AddedBy(6) Status(7) BuyDate(8) Comment(9)

## Dashboard (A:B)
Metric(A) Value(B). Updated by bot after each operation. No formulas.

## Logs (A:D)
timestamp period_key status message_id. For report idempotency.

## QUMMY items (Q01-Q19)
Q01 Pancakes chicken 360, Q02 Syrniki 400, Q03 Omelette rolls 400, Q04 Lazy vareniki 410, Q05 Borscht 400, Q06 Tom Yam 650, Q07 Chicken noodle 320, Q08 Beef stroganoff 530, Q09 Chicken pilaf 400, Q10 Chicken pasta 360, Q11 Beef goulash 630, Q12 Carbonara 450, Q13 White fish miso 480, Q14 Gyoza 400, Q15 Cottage cheese cake 400, Q16 Apple pancakes 320, Q17 Brownie 460, Q18 Chicken cutlets 500, Q19 Lyulya kebab 480.

## FOODBOX items (F01-F13)
F01 Water 5L 150, F02 Water 0.5L still 70, F03 Water 0.5L sparkling 70, F04 Cola Dobry 130, F05 Kvass 130, F06 Baltika 0 150, F07 Juice 60, F08 Adrenaline Rush 200, F09 Flash Ultra 150, F10 Snickers 100, F11 Twix 100, F12 Tuk cookies 150, F13 Herbal tea 300.

## Rules
1. Append-only for Operations, Supplies, Shopping, Logs
2. Update allowed for Goods(stock,status), Repairs(status), Shopping(status), Dashboard
3. Never delete rows
4. No formulas - write computed numbers
5. All dates MSK (Europe/Moscow, UTC+3, no DST)
