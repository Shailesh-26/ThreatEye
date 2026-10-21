import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { logout } from "../../services/authService";

/** Asks before signing out; signing out revokes the session on the server too. */
export default function SignOutDialog({ open, onClose }) {
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);

    async function confirm() {
        setBusy(true);
        await logout();
        setBusy(false);
        onClose();
        navigate("/login", { replace: true });
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Sign out of ThreatEye?"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Stay signed in</Button>
                    <Button variant="danger" onClick={confirm} disabled={busy}>
                        {busy ? "Signing out" : "Sign out"}
                    </Button>
                </>
            }
        >
            <p>Your session ends on this browser and on the server. The logs you uploaded stay saved.</p>
        </Modal>
    );
}
