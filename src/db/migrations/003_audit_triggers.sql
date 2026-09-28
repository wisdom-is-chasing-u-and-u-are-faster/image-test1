-- Migration: 003_audit_triggers.sql
-- Description: Hooks fn_ticket_audit_trigger onto tickets and fn_protect_audit_ledger onto ticket_audit_ledger

DROP TRIGGER IF EXISTS trg_ticket_audit_insert_update ON tickets;
CREATE TRIGGER trg_ticket_audit_insert_update
AFTER INSERT OR UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION fn_ticket_audit_trigger();

DROP TRIGGER IF EXISTS trg_protect_audit_ledger ON ticket_audit_ledger;
CREATE TRIGGER trg_protect_audit_ledger
BEFORE UPDATE OR DELETE ON ticket_audit_ledger
FOR EACH ROW EXECUTE FUNCTION fn_protect_audit_ledger();
