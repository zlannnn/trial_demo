import { z } from "zod";

import { db } from "~/server/db";

import { toToolFailure } from "./errors";
import { defineTool, formatBirthday } from "./helpers";

export const getUserProfileParameters = z.object({});

export const getUserProfileTool = defineTool({
  name: "getUserProfile",
  description:
    "Retrieve the current user's profile including birthday, gender, phone, address, and notes. Use when the user asks about their stored personal information.",
  parameters: getUserProfileParameters,
  execute: async (ctx) => {
    try {
      const profile = await db.userProfile.findUnique({
        where: { userId: ctx.userId },
        include: {
          user: {
            select: { id: true, email: true, name: true, avatar: true },
          },
        },
      });

      if (!profile) {
        return {
          success: true,
          data: {
            exists: false,
            profile: null,
            message: "No profile found for this user.",
          },
        };
      }

      return {
        success: true,
        data: {
          exists: true,
          profile: {
            id: profile.id,
            userId: profile.userId,
            birthday: formatBirthday(profile.birthday),
            gender: profile.gender,
            phone: profile.phone,
            address: profile.address,
            notes: profile.notes,
            user: profile.user,
          },
        },
      };
    } catch (error) {
      return toToolFailure(error);
    }
  },
});
