-- Trigger Function: fn_ticket_audit_trigger
-- Description: Calculates JSONB delta, fetches session actor, computes SHA-256 digest, and inserts immutable ledger entry

CREATE OR REPLACE FUNCTION fn_ticket_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_old_json JSONB;
    v_new_json JSONB;
    v_diff JSONB;
    v_checksum VARCHAR(64);
    v_key TEXT;
    v_val JSONB;
BEGIN
    BEGIN
        v_actor_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_actor_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        v_new_json := to_jsonb(NEW);
        v_checksum := encode(digest(v_new_json::text || clock_timestamp()::text, 'sha256'), 'hex');
        INSERT INTO ticket_audit_ledger (
            ticket_id, actor_id, action_type, old_state, new_state, diff_payload, checksum, timestamp
        ) VALUES (
            NEW.ticket_id, COALESCE(v_actor_id, NEW.requester_id), 'CREATE', NULL, v_new_json, v_new_json, v_checksum, clock_timestamp()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_json := to_jsonb(OLD);
        v_new_json := to_jsonb(NEW);
        v_diff := '{}'::JSONB;

        FOR v_key, v_val IN SELECT * FROM jsonb_each(v_new_json)
        LOOP
            IF v_old_json -> v_key IS DISTINCT FROM v_val THEN
                v_diff := v_diff || jsonb_build_object(v_key, jsonb_build_object('old', v_old_json -> v_key, 'new', v_val));
            END IF;
        END LOOP;

        v_checksum := encode(digest(v_diff::text || clock_timestamp()::text, 'sha256'), 'hex');

        INSERT INTO ticket_audit_ledger (
            ticket_id, actor_id, action_type, old_state, new_state, diff_payload, checksum, timestamp
        ) VALUES (
            NEW.ticket_id, v_actor_id, 'STATUS_UPDATE', v_old_json, v_new_json, v_diff, v_checksum, clock_timestamp()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
