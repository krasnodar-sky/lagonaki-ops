---
name: lagonaki-ops
description: Operations system for Lagonaki Glamp (glamping + foodtruck). Triggers on mentions of lagonaki, glamping, foodtruck, cabins, stock, repair, report, salary, admin, QUMMY, FOODBOX, writeoff, sale operations, repair photos, period reports.
---

# Lagonaki OPS

Skill for managing glamping operations via Claude Code on VPS.

## Business Context

- Lagonaki Glamp, Mezmay village, Krasnodar region, Russia
- Owner: Evgeniy Volkolupov (@krasnodar_sky)
- Objects: 4 cabins (C1-C4), Japanese bath (B1), food truck (FT), common area (AREA)
- Team: owner + 1 admin
- Food truck: 19 QUMMY dishes + 13 FOODBOX drinks/snacks
- Admin salary: 10% of QUMMY revenue + 20% of FOODBOX revenue
- Target: 300 portions/month

## Technical Infrastructure

- VPS: root@78.17.85.13 (Ubuntu 22.04, Node 20, Claude Code)
- Google Sheets v3 ID: 1X1Z9T9QUxNY0faFyqjQeJDgwNjFHuh4lRkZDnnbyLDM
- Service Account: foodtrack@omega-pivot-496511-f8.iam.gserviceaccount.com
- Code: /root/lagonaki/ (reports), /root/foodtruck-bot/ (main bot)
- GitHub: krasnodar-sky/lagonaki-ops

## Table Structure (7 sheets)

See data_model.md for full column definitions.

| Sheet | Purpose | Key columns |
|-------|---------|-------------|
| Objects | 7 glamping objects | ID, Name, Type |
| Goods | 32 items (Q01-Q19, F01-F13) | ID, Name, Category, Price, Cost, Stock, MinStock |
| Operations | Sales and writeoffs | DateTime, Type(sale/writeoff), SKU, Qty, Total, Who |
| Supplies | Purchase records | Date, SKU, Qty, BuyPrice, Supplier |
| Repairs | Repair tickets | ID, Object, Description, Urgency(1-5), Photo, Status |
| Shopping | Shopping list | SKU, Object, Priority, Status |
| Dashboard | Summary KPIs | Metric, Value |

## Triggers

1. Free text sale: '3 borscht and 2 colas'
2. Repair photo: image + question about damage
3. Report request: 'report for last week'
4. Stock check: 'what is running low?'
5. Salary calc: 'admin salary for May?'
6. Repair management: 'create repair ticket for cabin 2'
7. Purchases: 'admin bought 5 bottles of water at 32.50'

## Workflows

See workflows.md for detailed step-by-step processes.

## Data Conventions

- Date format: dd.MM.yyyy or dd.MM.yyyy HH:mm (MSK)
- Operation types: sale, writeoff
- Categories: QUMMY (food), FOODBOX (drinks/snacks), SUPPLY (consumables)
- Item IDs: Q01-Q19, F01-F13
- Repair statuses: new, in_progress, done, closed
- Urgency: 1 (cosmetic) to 5 (guest danger)
- Currency: RUB, no kopecks
- Language: Russian everywhere
- Append-only for Operations, Supplies, Shopping, Logs
- Never delete rows - cancel by adding negative-qty row
- No formulas in sheets - bot writes computed numbers directly

## Limitations

- Do NOT manage bookings (handled by TravelLine)
- Do NOT touch Japanese bath (deferred)
- Do NOT record payment method (there is a cash register)
- Do NOT delete rows - only append or update status
- On write error - notify owner, do not retry without confirmation

## Related Skills

- gws-sheets: Google Sheets read/write
- pdf: supplier invoices
- xlsx: report export
- mcp-builder: if MCP server needed for validation
