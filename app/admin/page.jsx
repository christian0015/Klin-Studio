import { isAdmin } from "@/lib/auth";
import Admin from "@/components/Admin";
export const dynamic = "force-dynamic";
export default async function Page() { return <Admin authed={await isAdmin()} />; }
