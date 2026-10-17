import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { login } from "@/app/auth-actions";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentUser()) redirect("/");
  const { error } = await searchParams;
  return (
    <div className="login">
      <form action={login} className="panel form">
        <h1>Sign in to Stockroom</h1>
        {error && <div className="banner err">{error}</div>}
        <label>Email<input name="email" type="email" autoComplete="username" required autoFocus /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        <button className="btn">Sign in</button>
      </form>
    </div>
  );
}
