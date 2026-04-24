import { useState } from "react";
import CCEmailInput from "./CCEmailInput";
export default function CCEmailInput() {

  const [ccEmails, setCcEmails] = useState<string[]>([]);

  return (
    <div className="p-6">

      <h2 className="text-xl font-semibold mb-4">
        Manage CC Emails
      </h2>

      <p className="text-sm text-gray-500 mb-4">
        Add up to 2 emails that will receive compliance notifications.
      </p>

      <CCEmailInput
        ccEmails={ccEmails}
        setCcEmails={setCcEmails}
      />

    </div>
  );
}