# Farmhouse

Pull one trace before calling the lender.

```loe
GND box @farmhouse_box
DIR aim buy_farmhouse_upstate
GND witness @saved_listings from "saved_listings.md" with v_apr9
MOV move call_lender via manual
TST test lender_replies
RTN receipt @lender_reply via lender_portal as score
CLS reroute search_region
```
