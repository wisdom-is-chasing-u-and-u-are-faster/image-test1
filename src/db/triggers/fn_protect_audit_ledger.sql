-- Trigger Function: fn_protect_audit_ledger
-- Description: Prevents any UPDATE or DELETE mutation on ticket_audit_ledger, guaranteeing 100% append-only immutability

CREATE OR REPLACE FUNCTION fn_protect_audit_ledger()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit ledger is strictly immutable. % operation prohibited.', TG_OP
        USING ERRCODE = '23506',
              HINT = 'Direct modification or removal of audit logs violates enterprise compliance policies.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
