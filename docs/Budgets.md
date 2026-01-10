# Implementation Plan: Budgeting Module (Simple Spending Tracker)

## 1. Overview
The goal is to implement a simple spending tracker that organizes transactions into **Categories**, which are then grouped under **Supercategories**. Users allocate a "Total Budget" for the period, which is then distributed among these Supercategories.

## 2. Core Concepts
* **Single Active Budget:** Only one budget template can be active at a time.
* **Template vs. Instance:** A "Template" stores the master plan. An "Instance" is the live budget for the current period (e.g., January 2026).
* **Allocation:** Users set budgets via fixed dollar amounts or percentages of the Total Budget.
* **Mid-Month Transfers:** Users can move money between Supercategories within a live instance without affecting the master Template.
* **No Rollovers:** Each period resets to the Template values regardless of leftover funds.

## 3. Data Architecture (Supabase/PostgreSQL)

### Table: `budget_templates`
Stores the high-level configuration.
* `id` (UUID, PK)
* `user_id` (UUID, FK)
* `total_budget` (Numeric) - The total pot of money.
* `timeframe` (Enum) - `weekly`, `bi-weekly`, `monthly`.
* `is_active` (Boolean) - Default: `true`.

### Table: `supercategories`
The parent buckets for categories.
* `id` (UUID, PK)
* `template_id` (UUID, FK)
* `name` (Text) - e.g., "Food", "Transport", "Miscellaneous".
* `allocation_type` (Enum) - `fixed`, `percentage`.
* `allocation_value` (Numeric) - Either the dollar amount or the percentage (0-100).
* `is_misc` (Boolean) - Identifies the catch-all bucket.

### Table: `categories`
Individual transaction tags.
* `id` (UUID, PK)
* `supercategory_id` (UUID, FK) - Locked to one parent.
* `name` (Text) - e.g., "Groceries", "Dining Out".

### Table: `budget_instances`
The "Live" budget tracker for a specific date range.
* `id` (UUID, PK)
* `template_id` (UUID, FK)
* `start_date` (Date)
* `end_date` (Date)
* `actual_allocations` (JSONB) - A snapshot of supercategory IDs and their current dollar amounts for **this period only**. This allows for mid-month transfers without changing the template.

## 4. Feature Logic

### Allocation Logic
* **Calculation:** When a user selects "Percentage", the system must calculate: `Amount = Total Budget * (Percentage / 100)`.
* **Storage:** Store the base preference in `supercategories`. When an instance is created, convert all percentages to hard dollar values.

### The Miscellaneous "Catch-all"
* The system must have one Supercategory flagged as `is_misc`.
* Any transaction assigned to a "General" category (or categories not explicitly linked to another Supercategory) must roll up to this bucket.
* User must be able to assign a "Buffer" amount to this bucket.

### Mid-Month Transfers
* **Function:** `transferFunds(from_super_id, to_super_id, amount)`
* **Action:** Updates only the `actual_allocations` JSONB in the `budget_instances` table. It does NOT touch the `supercategories` table.

### Reset Mechanism
* When the `current_date` exceeds `budget_instance.end_date`:
    1.  Create a new `budget_instance`.
    2.  Pull `allocation_value` from the `supercategories` template.
    3.  Ignore any transfers or overspending from the previous month.

## 5. UI/UX Requirements (Health Tracking)
For each Supercategory, calculate and display:
1.  **Spent:** `SUM(transactions.amount)` where `category.supercategory_id` matches.
2.  **Remaining:** `Instance_Allocation - Spent`.
3.  **Visual Health:** * `Progress = (Spent / Instance_Allocation) * 100`.
    * **Normal:** Progress < 100%.
    * **Overspent:** Progress > 100% (Visual alert/Red bar).

## 6. Implementation Steps for Agent
1.  Initialize the SQL schema in Supabase.
2.  Create a "Sync" function that ensures every transaction category is mapped to a Supercategory (defaulting to Misc).
3.  Build the "Template Creator" UI allowing users to toggle between $ and % for allocations.
4.  Build the "Dashboard" view that aggregates transaction data into Supercategory progress bars.
5.  Implement the "Transfer" modal to allow shifting money between Supercategories.