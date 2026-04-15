# Technical Documentation: Outbound Finalization Flow

## Overview
The Outbound Finalization flow has been refactored to ensure data integrity, inventory accuracy, and a seamless user experience. The finalization process is now integrated directly into the Outbound Process page, allowing users to review fulfillment progress and commit transactions in one place.

## Key Changes
1. **Inventory Synchronization**: The finalization process now correctly decrements stock from `ItemLocation` and updates the total `current_stock` for the `Item`.
2. **Audit Logging**: Every finalization action is logged with details of the items processed and confirmation of user notification.
3. **UI/UX Integration**: A dedicated "Finalization Control" section has been added to the `OutboundProcess` page, featuring:
   - Real-time fulfillment progress bar.
   - Summary of staged vs target quantities.
   - Smart action button (enabled only at 100% fulfillment).
4. **Data Validation**: Strict validation ensures that an order can only be finalized when all required items have been staged.

## Process Flow
1. **Fulfillment**: Warehouse operators scan items and assign them to staging sessions.
2. **Review**: Users monitor progress on the `OutboundProcess` page.
3. **Finalization**:
   - Once progress reaches 100%, the "COMMIT & FINALIZE SESSION" button becomes active.
   - System validates all items against the outbound order requirements.
   - System decrements stock from source locations.
   - System creates `InventoryMovement` records.
   - Outbound order status is updated to `DONE`.
   - Associated staging sessions are automatically closed/finalized.
4. **Confirmation**: A success notification is shown to the user, and the inventory matrix is synchronized.

## Backend Services
- `finalize-session-service.js`: Handles finalization of a specific staging batch.
- `finalize-order-sync-service.js`: Handles finalization and synchronization of an entire outbound order.

## Testing
- Unit tests cover fulfillment validation, stock decrementing, and status updates.
- Integration tests verify the end-to-end flow from staging to order completion.
