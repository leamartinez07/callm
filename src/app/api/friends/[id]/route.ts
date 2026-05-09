import { connectDB } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, notFound, forbidden, serverError } from "@/lib/response";
import Invite from "@/models/Invite";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/friends/[id] — accept or decline a friend request
export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { id } = await params;
  const { status } = await request.json();

  if (!["accepted", "declined"].includes(status)) {
    return notFound();
  }

  try {
    await connectDB();
    const invite = await Invite.findById(id);
    if (!invite) return notFound();

    const toId = (invite.to as unknown as { toString(): string }).toString?.() ?? String(invite.to);
    if (toId !== auth.sub) return forbidden();

    invite.status = status;
    await invite.save();

    return ok({ data: invite });
  } catch (e) {
    console.error("[friends PATCH]", e);
    return serverError();
  }
}

// DELETE /api/friends/[id] — unfriend (delete invite)
export async function DELETE(request: Request, { params }: Params) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { id } = await params;

  try {
    await connectDB();
    const invite = await Invite.findById(id);
    if (!invite) return notFound();

    const fromId = (invite.from as unknown as { toString(): string }).toString?.() ?? String(invite.from);
    const toId   = (invite.to   as unknown as { toString(): string }).toString?.() ?? String(invite.to);

    if (fromId !== auth.sub && toId !== auth.sub) return forbidden();

    await invite.deleteOne();
    return ok({ data: { deleted: true } });
  } catch (e) {
    console.error("[friends DELETE]", e);
    return serverError();
  }
}
