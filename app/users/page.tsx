import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createUser, deleteUser } from "@/app/auth-actions";

export const dynamic = "force-dynamic";

export default async function Users({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const me = await requireAdmin();
  const { error, ok } = await searchParams;
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <>
      <h1>Users</h1>
      <p className="muted">Admins can manage users and delete products. Staff can add products and update stock.</p>
      {error && <div className="banner err">{error}</div>}
      {ok && <div className="banner ok">{ok}</div>}

      <div className="cols">
        <section className="panel">
          <h2>Accounts</h2>
          <table>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}<small>{u.email}</small></td>
                  <td>{u.role === "ADMIN" ? "Admin" : "Staff"}</td>
                  <td className="num">
                    {u.id !== me.id && (
                      <form action={deleteUser}><input type="hidden" name="id" value={u.id} /><button className="linkbtn bad">Remove</button></form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <form action={createUser} className="panel form">
          <h2>Add a user</h2>
          <label>Name<input name="name" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Temporary password<input name="password" type="password" minLength={8} required /></label>
          <label>Role
            <select name="role" defaultValue="STAFF"><option value="STAFF">Staff</option><option value="ADMIN">Admin</option></select>
          </label>
          <button className="btn">Create account</button>
        </form>
      </div>
    </>
  );
}
