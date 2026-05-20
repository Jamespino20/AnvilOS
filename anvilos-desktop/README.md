# HardwareHub
## Created by: JCBP Solutions
### Espino, James Bryant De la Paz
### Mangalus, Camille Joyce Laya
### Cruz, Sebastianne Bernard
### Lanuza, Patrick Alfred Cruz

HardwareHub is a comprehensive, Java-based Point of Sale (POS) and Inventory Management System powered by MySQL, specifically designed for hardware stores. It provides robust features for sales, returns, restocking, adjustments, damage tracking, and extensive reporting, all wrapped in a modern, user-friendly desktop interface. This was a fun little uni thesis project for an object-oriented programming course, dedicated to a family-run hardware retail business. 

Fair warning that this project has been built with Ant, a teaching in my university where surely it's no longer industry-level.

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Database Schema](#database-schema)
- [Return and Transaction Logic](#return-and-transaction-logic)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## Features

- **Sales Management**: Create and manage walk-in and purchase order sales, including printable receipts.
- **Return Processing**: Secure, validated returns tied to original sales receipts. Prevents duplicate and recursive returns.
- **Restocking & Adjustments**: Replenish inventory, record adjustments, and log damaged goods.
- **Inventory Tracking**: Real-time product tracking, low/no stock alerts, category & supplier organization.
- **User Management**: Secure login and role-based access.
- **Audit Logs**: Transparent tracking of POS activity.
- **Reports**: Generate PDF receipts and transaction logs.
- **Modern UI**: Intuitive, responsive Swing-based interface.

---

## Getting Started

### Prerequisites

- Java 11 or higher
- MySQL (or compatible database)
- Ant (for building)
- (Recommended) A modern IDE (e.g., IntelliJ IDEA, Eclipse)

### Setup

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Jamespino20/hardwarehub.git
   cd hardwarehub
   ```

2. **Set up the database:**
   - Import the SQL schema found in `/db_hardwarehub/` into your MySQL server.
   - Configure your DB credentials in `hardwarehub_main/util/DBConnection.java`.

3. **Build and run:**
java -jar "C:\Users\[system_filepath]\HardwareHub\dist\HardwareHub.jar"
   Or, run directly from your IDE.

---

## Database Schema

Key tables:

- `transactions`
  - Sales, returns, restocking, adjustments, damage
  - Columns: `TRANSACTION_ID`, `TRANSACTION_TYPE`, `IS_RETURNED`, `RETURN_FOR_RECEIPT_NUMBER`, `RECEIPT_NUMBER`, etc.
- `transaction_items`
  - Line items for each transaction (product, quantity, unit price)
- `products`
  - Product inventory, min thresholds, supplier, category
- `users`
  - App user accounts, roles
- `audit_logs`
  - Action tracking

**Returns Logic Columns:**
- `IS_RETURNED` (TINYINT NOT NULL DEFAULT 0) — 1 for returns, 0 for others
- `RETURN_FOR_RECEIPT_NUMBER` (INT, nullable) — links return to original sale

---

## Return and Transaction Logic

- **Returns are only allowed for original sales (`Sale Walk-In`, `Sale PO`) that have not previously been returned.**
- **A sale can be returned only ONCE.** After a return, its `IS_RETURNED` is set to 1.
- **Returns of returns are not allowed.** You cannot use a return receipt number to process another return.
- **When switching to the Return transaction type:**
  - The app prompts for a sale receipt number.
  - If the receipt is invalid, a return, or already returned, the user is blocked from proceeding.
- **All previous returns for a sale are checked to prevent over-returns.**

---

## Development

**Main technologies:**
- Java 21+
- Swing (UI)
- MySQL (database)
- Ant (build)
- iText (PDF receipt generation)

**Code Structure:**
- `hardwarehub_main/model/` — Data models (Product, Transaction, etc.)
- `hardwarehub_main/dao/` — Database access objects
- `hardwarehub_main/gui/` — GUI code (POSPanel, Dashboard, etc.)
- `hardwarehub_main/util/` — Utilities (icons, DB, etc.)

**Building:**
- Use Ant or your IDE to build.
- Ensure the DB is running and credentials are correct.

---

## Contributing

Contributions are welcome! Please:
- Open issues for bugs/feature requests.
- Fork and submit pull requests for improvements.
- Ensure code follows existing style and is well-tested.

---

## License

This project is licensed under the Apache 2.0 License. See [LICENSE](https://github.com/Jamespino20/hardwarehub/blob/main/APACHE_LICENSE.md) for details.

---

## Credits

Developed by [Jamespino20](https://github.com/Jamespino20)  
With thanks to the open-source Java and Swing communities.
