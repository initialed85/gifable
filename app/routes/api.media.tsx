import type { LoaderArgs } from "@remix-run/node";
import type { Prisma } from "@prisma/client";

import { db } from "~/utils/db.server";

import { unauthorized } from "remix-utils";
import env from "~/utils/env.server";
import { getUserId } from "~/utils/session.server";

export async function loader({ request }: LoaderArgs) {
  let userId: string | null;
  if (env.get("SSO_AUTH_ENABLED") === "true") {
    userId = await getUserId(request);
  } else {
    const auth = request.headers.get("Authorization");
    if (!auth) return unauthorized({ message: "Unauthorized" });

    const token = auth.replace("Bearer ", "");
    const [user] = await db.user.findMany({
      where: { apiToken: token },
      select: { id: true },
    });
    userId = user?.id || null;
  }

  if (!userId) return unauthorized({ message: "Unauthorized" });

  const params = new URLSearchParams(request.url.split("?")[1]);
  const where: Prisma.MediaWhereInput = { userId };
  const search = (params.get("search") || "").trim();

  if (search) {
    where.labels = { contains: search };
  }

  const data = await db.media.findMany({
    where,
    select: {
      id: true,
      url: true,
      thumbnailUrl: true,
      labels: true,
      width: true,
      height: true,
      color: true,
      altText: true,
      user: {
        select: {
          username: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
