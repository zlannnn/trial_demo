import { z } from "zod";

import { db } from "~/server/db";

import { NotFoundError, toToolFailure } from "./errors";
import { defineTool, formatBirthday, parseBirthday } from "./helpers";

const genderEnum = z.enum([
  "MALE",
  "FEMALE",
  "OTHER",
  "PREFER_NOT_TO_SAY",
]);

export const updateUserProfileParameters = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe("Updated display name"),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD")
    .optional()
    .describe("Updated birthday in YYYY-MM-DD format"),
  gender: genderEnum.optional().describe("Updated gender"),
  phone: z.string().max(20).optional().describe("Updated phone number"),
  address: z.string().max(500).optional().describe("Updated address"),
  notes: z.string().max(2000).optional().describe("Updated notes"),
});

export const updateUserProfileTool = defineTool({
  name: "updateUserProfile",
  description:
    "Update an existing user profile. Use when the user wants to change or add personal information. Only provided fields will be updated.",
  parameters: updateUserProfileParameters,
  execute: async (ctx, args) => {
    try {
      const existing = await db.userProfile.findUnique({
        where: { userId: ctx.userId },
      });

      if (!existing) {
        throw new NotFoundError("User profile");
      }

      const [profile, user] = await db.$transaction(async (tx) => {
        if (args.name !== undefined) {
          await tx.user.update({
            where: { id: ctx.userId },
            data: { name: args.name },
          });
        }

        const updatedProfile = await tx.userProfile.update({
          where: { userId: ctx.userId },
          data: {
            ...(args.birthday !== undefined && {
              birthday: parseBirthday(args.birthday),
            }),
            ...(args.gender !== undefined && { gender: args.gender }),
            ...(args.phone !== undefined && { phone: args.phone }),
            ...(args.address !== undefined && { address: args.address }),
            ...(args.notes !== undefined && { notes: args.notes }),
          },
        });

        const updatedUser = await tx.user.findUniqueOrThrow({
          where: { id: ctx.userId },
          select: { id: true, name: true, email: true },
        });

        return [updatedProfile, updatedUser] as const;
      });

      return {
        success: true,
        data: {
          id: profile.id,
          userId: profile.userId,
          name: user.name,
          birthday: formatBirthday(profile.birthday),
          gender: profile.gender,
          phone: profile.phone,
          address: profile.address,
          notes: profile.notes,
        },
      };
    } catch (error) {
      return toToolFailure(error);
    }
  },
});
