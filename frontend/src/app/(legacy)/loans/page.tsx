import { redirect } from "next/navigation";

export default function LoansLegacyRedirectPage() {
  redirect("/admin/loans");
}
